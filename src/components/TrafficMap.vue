<template>
<div class="container mt-4 hover-container">
  <div class="ct">
    <svg ref="mapContainer"></svg>
    <div class="hover-map" v-if="Object.keys(mapStore.junctions).length > 0">
      <button :class="['btn btn-sm me-2', simulationStore.activeToggleLinks ? 'btn-warning' : 'btn-light']" @click="simulationStore.activeToggleLinks=!simulationStore.activeToggleLinks" data-bs-toggle="tooltip" data-bs-placement="top"   :title="simulationStore.activeToggleLinks ? 'Show all edges' : 'Highlight active edges'">
        <i class="bi bi-eye"></i>
      </button>
      <button class="btn btn-light btn-sm me-2" @click="pickFile" data-bs-toggle="tooltip" data-bs-placement="top" title="Import map coordinates">
        <i class="bi bi-file-earmark-arrow-up"></i>
      </button>
      <button class="btn btn-light btn-sm me-2" @click="exportMapCoordinates" data-bs-toggle="tooltip" data-bs-placement="top" title="Export map coordinates">
        <i class="bi bi-file-earmark-arrow-down"></i>
      </button>
      <button class="btn btn-light btn-sm me-2" @click="rotateGraph" data-bs-toggle="tooltip" data-bs-placement="top" title="Rotate map">
        <i class="bi bi-arrow-clockwise"></i>
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json"
        style="display: none"
        @change="importMapCoordinates"
      />
    </div>
  </div>
</div>
</template>

<script setup lang="ts">

  import { onMounted, watch, ref } from "vue";
  import * as d3 from "d3";
  import { useMapStore } from "../stores/useMapStore.ts";
  import { useSimulationStore } from "../stores/useSimulationStore.ts";

  const mapStore = useMapStore();
  const simulationStore = useSimulationStore();
  const mapContainer = ref<SVGSVGElement | null>(null);
  const width = 800;
  const height = 600;
  let junctions: { id: string; x: number; y: number; }[] = [];
  let externalJunctions: any[] = [];
  let links: { source: string; target: string; }[] = [];
  let simulation: d3.Simulation<{ id: string; x: number; y: number; }, undefined>
  let link: d3.Selection<SVGPathElement, { source: string; target: string; }, SVGGElement, unknown>
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
  const colorScale = d3.scaleLinear<string>()
    .domain([0, 0.5, 1]) // 0 = green, 0.5 = yellow, 1 = red
    .range(["green", "yellow", "red"]);

  const tooltip = d3.select("div")
  .append("div")
  .attr("id", "tooltip")
  .style("position", "absolute")
  .style("visibility", "hidden")
  .style("background", "rgba(0, 0, 0, 0.7)")
  .style("color", "white")
  .style("padding", "6px 9px")
  .style("border-radius", "4px")
  .style("font-size", "13px")
  .style("pointer-events", "none");

  let minCapacity: d3.NumberValue;
  let maxCapacity: d3.NumberValue;

  const fileInput = ref<HTMLInputElement | null>(null);

  const pickFile = () => {
    fileInput.value?.click();
  };

  const reset = () => {
    if (simulation) {
      simulation.stop()
    }
    if (svg) {
      svg.selectAll("*").remove();
    }
    junctions = []
    externalJunctions = []
    links = []
}

  const rotateGraph = () => {
    const angleDeg = 30;
    const center = {x:300, y:250};
    const duration = 500;
    const startPositions = junctions.map(node => ({ x: node.x, y: node.y }));
    const angleRad = (angleDeg * Math.PI) / 180;

    const interpolate = (t: number) => {
      junctions.forEach((node, i) => {
        const dx = startPositions[i].x - center.x;
        const dy = startPositions[i].y - center.y;
        node.x = dx * Math.cos(angleRad * t) - dy * Math.sin(angleRad * t) + center.x;
        node.y = dx * Math.sin(angleRad * t) + dy * Math.cos(angleRad * t) + center.y;
      });
    };

    d3.transition()
      .duration(duration)
      .tween('rotate', () => {
        const interpolator = d3.interpolateNumber(0, 1);
        return t => interpolate(interpolator(t));
      });

      simulation.alpha(0.3).restart();

  };

  const setup = () => {
    junctions = Object.values(mapStore.junctions).map((junction) => ({ id: junction.id, x: 0, y: 0, external:false }));

    const capacityValues = Object.values(mapStore.links)
      .map(d => d.capacity)
      .filter(cap => cap < 100000); 
    minCapacity = d3.min(capacityValues) ?? 1;
    maxCapacity = d3.max(capacityValues) ?? 50;

    const linksArray = Object.values(mapStore.links);
    const linkCounts = new Map<string, number>();

    linksArray.forEach((link) => {
      const key = `${link.source}-${link.destination}`;
      linkCounts.set(key, (linkCounts.get(key) || 0) + 1);
    });

    links = linksArray.map((link) => {
      const key = `${link.source}-${link.destination}`;

      const reverseExists = linksArray.some((l: any) =>
        l.source === link.destination && l.destination === link.source
      );

      const currentIndex = linkCounts.get(key) || 0;
      linkCounts.set(key, currentIndex - 1);

      return { 
        id: link.id, 
        occupancy: link.occupancy, 
        capacity: link.capacity, 
        source: link.source, 
        target: link.destination, 
        active: link.active,
        bidirectional: reverseExists,
        linknum: currentIndex+(reverseExists ? 1 : 0),
      };
    });

    Object.values(mapStore.links).forEach((link) => {
      if (!junctions.some((junction) => junction.id === link.source)) {
        if (!externalJunctions.some(junction => junction.id === link.source)) {
          externalJunctions.push({ id: link.source, x: 0, y: 0, external:true });
        }
      }
      if (!junctions.some((junction) => junction.id === link.destination)) {
        if (!externalJunctions.some(junction => junction.id === link.destination)) {
          externalJunctions.push({ id: link.destination, x: 0, y: 0, external:true });
        }
      }
    });
    junctions.push(...externalJunctions);

    if (junctions.length > 0) {
      junctions[0].x = 10
      junctions[0].y = -0
    }

  }

  const update = () => {
    links.forEach((link: any) => {
      link.occupancy = mapStore.links[link.id].occupancy
      link.capacity = mapStore.links[link.id].capacity
      link.active = mapStore.links[link.id].active
    })
  }

  const updateMap = () => {
    if (!mapContainer.value) return;
    svg = d3.select(mapContainer.value)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)

    svg.selectAll("*").remove();

    const g = svg.append("g");
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });
    (svg as any).call(zoom);
      
    simulation = d3.forceSimulation(junctions)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(300, 250))
      .force("collision", d3.forceCollide(80));
      
    const drag = d3.drag()
      .on("start", (event: any, d: any) => {
        if (!event.active) simulation.alphaTarget(0.01).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event: any, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event: any, d: any) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    
    const strokeScale = d3.scaleLinear().domain([minCapacity, maxCapacity]).range([3, 9]);
    const scale = [37,29,25,22,20,18,16,15]

    link = g.append("g")
    .selectAll("path")
    .data(links)
    .enter().append("path")
    .attr("fill", "none")
    .attr("stroke-width", (d: any) => d.capacity === 100000 ? 3 : Math.floor(strokeScale(d.capacity)))
    .attr("stroke", (d: any) => colorScale(d.occupancy / d.capacity))
      .each((d: any) => {

        const refX = d.capacity === 100000 ? scale[0] : scale[Math.floor(strokeScale(d.capacity))-3];
        const refY = 5 + getIncrement(d);

        svg.append("defs").append("marker")
          .attr("id", `arrow-${d.id}`)
          .attr("viewBox", "0 0 10 10")
          .attr("refX",refX)
          .attr("refY", refY)
          .attr("markerWidth", 3)
          .attr("markerHeight", 3)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,0 L10,5 L0,10")
          .attr("fill", colorScale(d.occupancy / d.capacity))
        })
      .attr("marker-end", (d: any) => `url(#arrow-${d.id})`)
      .on("mouseover", (event, d: any) => {
        tooltip.text(d.id)
          .style("visibility", "visible");
      })
      .on("mousemove", (event) => {
        tooltip.style("top", (event.pageY + 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    const junction = g.append("g")
      .selectAll("circle")
      .data(junctions)
      .enter().append("circle")
      .attr("r", 26)
      .attr("fill", (d: any) => (d.external) ? "#CE7E31" : "steelblue")
      .attr("stroke", "black")
      .call(drag as any)

    const label = g.append("g")
      .selectAll("text")
      .data(junctions)
      .enter().append("text")
      .text((d: any) => d.id)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .attr("font-weight","bold")
      .attr("font-size", 15);

    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
      return 'M' + d.source.x + ',' + d.source.y + link_arc2(d) + d.target.x + ',' + d.target.y

    });

      junction
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });
  }

  const getIncrement = (link: any) => {
    if (link.bidirectional) {
      return (link.linknum - 2) * 0.5 + 1;
    }

    if (link.linknum === 2) return 1.5;
    if (link.linknum === 3) return 2;
    if (link.linknum >= 4) return 2 - (link.linknum - 3) * 0.5;

    return 0;
  };

  const updateActiveLinks = () => {
  if (link) {
    link.data(links).transition().duration(50)
      .attr("stroke", (d: any) => colorScale(d.occupancy / d.capacity))
      link.data(links)
      .attr("stroke-dasharray", (d: any) => {
          if (!simulationStore.activeToggleLinks) {
            return 0;
          }
          return (d.active) ? 0 : 8;
        })

      link.each((d: any) => {
        svg.select(`#arrow-${d.id} path`).transition().duration(50)
          .attr("fill", colorScale(d.occupancy / d.capacity))
      });
    }
  }

  const exportMapCoordinates = () => {
    if (junctions.length > 0) {
      const cleanedJunctions = junctions.map(({ id, x, y }) => ({ id, x, y }));
      const json = JSON.stringify(cleanedJunctions, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  const importMapCoordinates = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const text = await file.text();
    const objects = JSON.parse(text) as { id: string; x: number; y: number }[];

    objects.forEach(object => {
      const junction = junctions.find(junction => junction.id === object.id);
      if (junction) {
        junction.x = object.x;
        junction.y = object.y;
      }
    });
    input.value = "";
    updateMap();
    updateActiveLinks();
  };

  function link_arc2(d: any) {
    let sx = d.source.x;
    let sy = d.source.y;
    let tx = d.target.x;
    let ty = d.target.y;

    let baseCd = 35;
    let cd = baseCd + (d.linknum - 1) * 12; 

    let cx = (sx + tx) / 2;
    let cy = (sy + ty) / 2;

    let angle = Math.atan2(ty - sy, tx - sx);
    let c_angle = angle + Math.PI / 2;

    let offset = ((d.linknum - (d.linknum + 1) / 2) * cd);
    let qx = cx + offset * Math.cos(c_angle);
    let qy = cy + offset * Math.sin(c_angle);

    return `Q ${qx},${qy} `;
}

  watch(
    () => [mapStore.junctions, mapStore.links],
    () => {
      let temp = Object.keys(junctions).length
      if (temp == 0) {
        setup();
        updateMap();
      }
      update();
      updateActiveLinks();
    },
    { deep: true, immediate: true }
  );

  watch(
    () => [mapStore.resetStore],
    () => {
      if (mapStore.resetStore) {
        reset();
      }
    },
  );

  watch(
    () => [simulationStore.activeSimulation],
    () => {
      if (simulationStore.activeSimulation) {
        simulation.stop()
      }
    },
  );

  watch(
    () => [simulationStore.activeToggleLinks],
    () => {
     updateActiveLinks();
    },
    { deep: true, immediate: true }
  );

  onMounted(() => {
    updateMap();
  });
</script>

<style scoped>
  .ct {
    border: 1px solid black;
    border-radius: 10px;
    height: 500px;
    position: relative;
  }

  svg {
    width: 100%;
    height: 100%;
  }

  .hover-map {
    display: none;
    position: absolute;
    bottom: 10px;
    right: 10px;
    z-index: 10;
    text-align: end;
  }

  .hover-container:hover .hover-map {
    display: inline-block;
  }

</style>

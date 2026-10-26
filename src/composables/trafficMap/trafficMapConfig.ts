export const TRAFFIC_MAP_CONFIG = {
    width: 800,
    height: 600,
    center: {x: 300, y: 250},
    simulation: {
        linkDistance: 150,
        chargeStrength: -200,
        collideRadius: 80,
        dragAlphaTarget: 0.01,
    },
    node: {
        radius: 26,
        colors: {
            controllable: "steelblue",
            nonControllable: "#CE7E31"
        }
    },
    edge: {
        maxCapacity: 100000,
        strokeRange: [3, 8] as [number, number],
        dashed: 8,
        arrow : {
            size: 3,
            viewBox: 10,
            tipX: 10,
            baseX: 1
        }
    },
    zoom: {
        min: 0.5,
        max: 3
    },
    rotation: {
        angleDeg: 30,
        durationMs: 500
    }
} as const;
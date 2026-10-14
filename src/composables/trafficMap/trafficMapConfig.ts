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
        strokeRange: [3, 9] as [number, number],
        arrowRefX: [37, 29, 25, 22, 20, 18, 16, 15],
        dashed: 8
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
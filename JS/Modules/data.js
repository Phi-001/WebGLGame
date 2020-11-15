const noLight = {
    position: [0, 0, 0],
    direction: [0, -0, 0],
    cutOff: 0,
    outerCutOff: 0,
    color: [0, 0, 0],
    constant: 0,
    linear: 0,
    quadratic: 0,
};

// unit is meter
const levels = [
    {
        vertices: [
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,
            
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  10.0,
             1.0,  1.0,  10.0,
             1.0,  1.0, -1.0,
            
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  10.0,
            -1.0, -1.0,  10.0,
            
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  10.0,
             1.0, -1.0,  10.0,
            
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  10.0,
            -1.0,  1.0,  10.0,
            -1.0,  1.0, -1.0,

            -4.0,  1.0,  10.0,
            -4.0,  1.0,  14.0,
             4.0,  1.0,  14.0,
             4.0,  1.0,  10.0,

            -4.0, -1.0,  10.0,
             4.0, -1.0,  10.0,
             4.0, -1.0,  14.0,
            -4.0, -1.0,  14.0,
        ],
        indices: [
            2,  1,  0,      3,  2,  0, 
            6,  5,  4,      7,  6,  4,    
            10, 9,  8,      11, 10, 8,   
            14, 13, 12,     15, 14, 12,   
            18, 17, 16,     19, 18, 16, 
            22, 21, 20,     23, 22, 20,
            26, 25, 24,     27, 26, 24, 
        ],
        normals: [
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
        
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
        
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
        
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
        
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,

             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,
             0.0, -1.0,  0.0,

             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
             0.0,  1.0,  0.0,
        ],
        lights: [
            {
                position: [0, 1, 0],
                direction: [0, -1, 0],
                cutOff: Math.cos(1.4),
                outerCutOff: Math.cos(1.5),
                color: [1, 1, 1],
                constant: 1,
                linear: 0.7,
                quadratic: 1.8,
            },
            {
                position: [0, 1, 3],
                direction: [0, -1, 0],
                cutOff: Math.cos(1.4),
                outerCutOff: Math.cos(1.5),
                color: [1, 1, 1],
                constant: 1,
                linear: 0.7,
                quadratic: 1.8,
            },
            {
                position: [0, 1, 6],
                direction: [0, -1, 0],
                cutOff: Math.cos(1.4),
                outerCutOff: Math.cos(1.5),
                color: [1, 1, 1],
                constant: 1,
                linear: 0.7,
                quadratic: 1.8,
            },
            {
                position: [0, 1, 9],
                direction: [0, -1, 0],
                cutOff: Math.cos(1.4),
                outerCutOff: Math.cos(1.5),
                color: [1, 1, 1],
                constant: 1,
                linear: 0.7,
                quadratic: 1.8,
            },
            noLight
        ]
    },
];

export { levels };
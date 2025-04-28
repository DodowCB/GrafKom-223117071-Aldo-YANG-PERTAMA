// WebGL Kubus dengan Tekstur
// Menggunakan pure WebGL API tanpa Three.js

// -- Variabel Global --
let gl;                        // WebGL context
let program;                   // GL program
let vao;                       // Vertex Array Object
let texture;                   // Texture object
let lastTime = 0;              // Untuk animasi
let canvas;                    // Canvas element

// Matriks transformasi
let modelMatrix = mat4.create();
let viewMatrix = mat4.create();
let projectionMatrix = mat4.create();
let mvpMatrix = mat4.create();

// Rotation state
let rotationX = 0;
let rotationY = 0;
let rotationZ = 0;

// Mouse interaction
let mouseDown = false;
let lastMouseX = null;
let lastMouseY = null;

// -- Main Function --
window.onload = function() {
    initWebGL();
    setupShaders();
    setupBuffers();
    loadTexture('bigB.jpg');
    setupMouseControls();
    setupWheelZoom();
    drawScene();
};

// -- Inisialisasi WebGL --
function initWebGL() {
    canvas = document.getElementById('webgl-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    try {
        gl = canvas.getContext('webgl2');
        if (!gl) {
            gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        }
    } catch (e) {
        console.error("Error initializing WebGL:", e);
    }
    
    if (!gl) {
        alert("WebGL tidak tersedia di browser Anda.");
        return;
    }
    
    gl.clearColor(0.2, 0.2, 0.2, 1.0);  // Background abu-abu
    gl.clearDepth(1.0);                  // Clear everything
    gl.enable(gl.DEPTH_TEST);            // Enable depth testing
    gl.depthFunc(gl.LEQUAL);             // Near things obscure far things
    gl.enable(gl.CULL_FACE);             // Aktifkan culling
    gl.cullFace(gl.BACK);                // Jangan gambar back-face
    
    window.addEventListener('resize', handleWindowResize);
}

// -- Setup Vertex & Fragment Shaders --
function setupShaders() {
    const vsSource = `
        attribute vec3 aVertexPosition;
        attribute vec2 aTextureCoord;
        
        uniform mat4 uMVPMatrix;
        
        varying highp vec2 vTextureCoord;
        
        void main(void) {
            gl_Position = uMVPMatrix * vec4(aVertexPosition, 1.0);
            vTextureCoord = aTextureCoord;
        }
    `;
    
    const fsSource = `
        precision mediump float;
        
        varying highp vec2 vTextureCoord;
        
        uniform sampler2D uSampler;
        
        void main(void) {
            gl_FragColor = texture2D(uSampler, vTextureCoord);
        }
    `;
    
    // Create shader program
    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);
    
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(program));
        return;
    }
    
    gl.useProgram(program);
    
    // Get attribute and uniform locations
    program.vertexPositionAttribute = gl.getAttribLocation(program, 'aVertexPosition');
    program.textureCoordAttribute = gl.getAttribLocation(program, 'aTextureCoord');
    program.mvpMatrixUniform = gl.getUniformLocation(program, 'uMVPMatrix');
    program.samplerUniform = gl.getUniformLocation(program, 'uSampler');
}

// -- Kompilasi Shader --
function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    
    return shader;
}

// -- Setup Vertex dan Texture Coordinate Buffers --
function setupBuffers() {
    // Vertices untuk kubus
    const vertices = [
        // Front face
        -1.0, -1.0,  1.0,   // 0
         1.0, -1.0,  1.0,   // 1
         1.0,  1.0,  1.0,   // 2
        -1.0,  1.0,  1.0,   // 3
        
        // Back face
        -1.0, -1.0, -1.0,   // 4
        -1.0,  1.0, -1.0,   // 5
         1.0,  1.0, -1.0,   // 6
         1.0, -1.0, -1.0,   // 7
        
        // Top face
        -1.0,  1.0, -1.0,   // 8
        -1.0,  1.0,  1.0,   // 9
         1.0,  1.0,  1.0,   // 10
         1.0,  1.0, -1.0,   // 11
        
        // Bottom face
        -1.0, -1.0, -1.0,   // 12
         1.0, -1.0, -1.0,   // 13
         1.0, -1.0,  1.0,   // 14
        -1.0, -1.0,  1.0,   // 15
        
        // Right face
         1.0, -1.0, -1.0,   // 16
         1.0,  1.0, -1.0,   // 17
         1.0,  1.0,  1.0,   // 18
         1.0, -1.0,  1.0,   // 19
        
        // Left face
        -1.0, -1.0, -1.0,   // 20
        -1.0, -1.0,  1.0,   // 21
        -1.0,  1.0,  1.0,   // 22
        -1.0,  1.0, -1.0    // 23
    ];
    
    // Texture coordinates for each vertex of the cube
    const textureCoordinates = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        
        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        
        // Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        
        // Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        
        // Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        
        // Left face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ];
    
    // Indices defining triangles
    const indices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    
    // Create and bind vertex position buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.vertexPositionAttribute);
    
    // Create and bind texture coordinate buffer
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.textureCoordAttribute);
    
    // Create and bind index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}

// -- Load Texture --
function loadTexture(url) {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Fill with a placeholder pixel until the image loads
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
                  new Uint8Array([255, 0, 0, 255])); // Red placeholder
    
    // Load the texture
    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        // Check if the image dimensions are powers of 2
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // For non-power-of-2 textures
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
        
        console.log("Texture loaded successfully");
    };
    
    image.onerror = function() {
        console.error("Failed to load texture:", url);
    };
    
    image.src = url;
}

// -- Drawing the Scene --
function drawScene(timestamp) {
    if (!timestamp) timestamp = 0;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Resize canvas to match window
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Update rotation
    if (!mouseDown) { // Only auto-rotate when mouse is not pressed
        rotationY += 0.01;
        rotationX += 0.005;
        rotationZ += 0.003;
    }
    
    // Setup model matrix (combines rotations)
    mat4.identity(modelMatrix);
    mat4.rotateX(modelMatrix, modelMatrix, rotationX);
    mat4.rotateY(modelMatrix, modelMatrix, rotationY);
    mat4.rotateZ(modelMatrix, modelMatrix, rotationZ);
    
    // Setup view matrix (camera position)
    const cameraPosition = [0, 0, 5]; // Camera position
    const target = [0, 0, 0];         // Look at point
    const up = [0, 1, 0];             // Up vector
    mat4.lookAt(viewMatrix, cameraPosition, target, up);
    
    // Setup projection matrix
    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = canvas.width / canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    
    // Combine matrices: MVP = Projection * View * Model
    mat4.multiply(mvpMatrix, viewMatrix, modelMatrix);
    mat4.multiply(mvpMatrix, projectionMatrix, mvpMatrix);
    
    // Use our shader program
    gl.useProgram(program);
    
    // Set uniforms
    gl.uniformMatrix4fv(program.mvpMatrixUniform, false, mvpMatrix);
    
    // Activate texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(program.samplerUniform, 0);
    
    // Draw the cube (36 indices = 12 triangles = 6 faces * 2 triangles per face)
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    
    // Request another frame
    requestAnimationFrame(drawScene);
}

// -- Helper Functions --
function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

// -- Handle Window Resize --
function handleWindowResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

// -- Setup Mouse Controls for Rotation --
function setupMouseControls() {
    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchmove', handleTouchMove);
}

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp() {
    mouseDown = false;
}

function handleMouseMove(event) {
    if (!mouseDown) return;
    
    const newX = event.clientX;
    const newY = event.clientY;
    
    const deltaX = newX - lastMouseX;
    const deltaY = newY - lastMouseY;
    
    // Update rotations based on mouse movement
    rotationY += deltaX * 0.01;
    rotationX += deltaY * 0.01;
    
    lastMouseX = newX;
    lastMouseY = newY;
}

// Touch event handlers
function handleTouchStart(event) {
    if (event.touches.length === 1) {
        mouseDown = true;
        lastMouseX = event.touches[0].clientX;
        lastMouseY = event.touches[0].clientY;
    }
}

function handleTouchEnd() {
    mouseDown = false;
}

function handleTouchMove(event) {
    if (!mouseDown || event.touches.length !== 1) return;
    
    const newX = event.touches[0].clientX;
    const newY = event.touches[0].clientY;
    
    const deltaX = newX - lastMouseX;
    const deltaY = newY - lastMouseY;
    
    // Update rotations based on touch movement
    rotationY += deltaX * 0.01;
    rotationX += deltaY * 0.01;
    
    lastMouseX = newX;
    lastMouseY = newY;
    
    // Prevent scrolling
    event.preventDefault();
}

// -- Setup Wheel Zoom --
function setupWheelZoom() {
    canvas.addEventListener('wheel', handleWheel);
}

function handleWheel(event) {
    // Adjust camera position based on wheel
    const cameraZ = viewMatrix[14]; // Extract camera Z position from view matrix
    const zoomFactor = 0.1;
    
    if (event.deltaY > 0) {
        // Zoom out
        viewMatrix[14] = cameraZ + zoomFactor;
    } else {
        // Zoom in
        viewMatrix[14] = Math.max(2, cameraZ - zoomFactor);
    }
    
    event.preventDefault();
}
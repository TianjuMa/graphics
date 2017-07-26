// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' + //surface normal vector

    'uniform mat4 u_ViewMatrix;\n' +
    'uniform mat4 u_ProjMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' + //transformation matrix of the normal vector

    'uniform vec3 u_LightColor;\n' + //light color
    'uniform vec3 u_LightDirection;\n' + //position of the light source
    'uniform vec3 u_AmbientLight;\n' + //ambient light color
    'varying vec4 v_Color;\n' +

    'void main() {\n' +
    //normalize the normal because it is interpolated and is not 1.0 in length anymore
    '  vec3 normal = normalize(vec3(u_NormalMatrix*a_Normal));\n' +
    '  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;\n' +
    //the dot product of the light direction and the normal
    '  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
    '  vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL;\n' +
    '  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
    //calculate the final color from diffuse reflection and ambient reflection
    '  v_Color = vec4(diffuse + ambient, a_Color.a);\n' +
    '}\n';
//
// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +

    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';


// Global Variables
var floatsPerVertex = 10; //vertices

var LOOK_STEP = 0.1;
var camera = -1;
var camera2 = 0;
var currentAngle = 0.0;
var currentAngle1 = 0.0;

var ANGLE_STEP = 45.0; // default rotation angle rate (deg/sec)
var ANGLE_STEP1 = 45.0; // default rotation angle rate (deg/sec)
var canvas;
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();

// Global vars for mouse click-and-drag for rotation.
var isDrag = false; // mouse-drag: true when user holds down mouse button
var xMclik = 0.0; // last mouse button-down position (in CVV coords)
var yMclik = 0.0;
var xMdragTot = 0.0; // total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot = 0.0;

var qNew = new Quaternion(0, 0, 0, 1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0, 0, 0, 1); // 'current' orientation (made from qNew)
var quatMatrix = new Matrix4(); // rotation matrix, made from latest qTot

function main() {
    //==============================================================================
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
    // canvas.width = window.innerWidth * 2;
    // canvas.height = window.innerHeight - 100;

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Enable 3D depth-test when drawing: don't over-draw at any pixel
    gl.enable(gl.DEPTH_TEST);

    // Initialize a Vertex Buffer in the graphics system to hold our vertices
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to specify the vertex information');
        return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Get the storage locations of u_ViewMatrix and u_ProjMatrix variables
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    // var lightDirection = new Vector3([0.5, 0.2, 0.0]);
    var lightDirection = new Vector3([0.0, 1.0, 0.0]);

    var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    var u_AmbientLightColor = gl.getUniformLocation(gl.program, 'u_AmbientLightColor');
    var u_ColorMod = gl.getUniformLocation(gl.program, 'u_ColorMod');

    //world coordinate system
    //set the light color --> (1.0, 1.0, 1.0)
    gl.uniform3f(u_LightColor, 1, 1, 1);
    //set the ambient light color --> (0.5, 0.6, 0.6)
    gl.uniform3f(u_AmbientLight, 0.5, 0.6, 0.6);

    lightDirection.normalize();

    gl.uniform3fv(u_LightDirection, lightDirection.elements);

    if (!u_ViewMatrix || !u_ProjMatrix) {
        console.log('Failed to get u_ViewMatrix or u_ProjMatrix');
        return;
    }
    canvas.onmousedown = function(ev) {
        myMouseDown(ev, gl, canvas)
    };
    // when user's mouse button goes down, call mouseDown() function
    canvas.onmousemove = function(ev) {
        myMouseMove(ev, gl, canvas)
    };
    // when the mouse moves, call mouseMove() function
    canvas.onmouseup = function(ev) {
        myMouseUp(ev, gl, canvas)
    };
    // NOTE! 'onclick' event is SAME as on 'mouseup' event
    // in Chrome Brower on MS Windows 7, and possibly other
    // operating systems; thus I use 'mouseup' instead.
    // END Mouse & Keyboard Event-Handlers-----------------------------------


    var viewMatrix = new Matrix4();

    //key event
    document.onkeydown = function(ev) {
        keydown(ev, gl, u_ViewMatrix, u_ProjMatrix, u_NormalMatrix, viewMatrix, normalMatrix);
    };

    var projMatrix = new Matrix4();
    //  var modelMatrix = new Matrix4();
    var normalMatrix = new Matrix4();

    projMatrix.setPerspective(1, canvas.width / canvas.height, 1, 100);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    //  drawResize(currentAngle, currentAngle1, u_ViewMatrix, u_ProjMatrix, viewMatrix, u_NormalMatrix, normalMatrix);
    //  drawResize(currentAngle, currentAngle1, u_ViewMatrix, u_ProjMatrix, viewMatrix, u_NormalMatrix, normalMatrix);
    // Create, init current rotation angle value in JavaScript
    var currentAngle = 0;

    // ANIMATION: create 'tick' variable whose value is this function:
    var tick = function() {
        //    drawResize(currentAngle, currentAngle1, u_ViewMatrix, u_ProjMatrix, viewMatrix, u_NormalMatrix, normalMatrix);
        currentAngle = animate(currentAngle); // Update the rotation angle
        currentAngle1 = animate1(currentAngle1);
        // canvas.width = innerWidth ;
        // canvas.height = innerHeight * 0.75;
        initVertexBuffers(gl);
        //  drawResize(currentAngle, currentAngle1, u_ViewMatrix, u_ProjMatrix, viewMatrix, u_NormalMatrix, normalMatrix);
        drawResize(currentAngle, currentAngle1, u_ViewMatrix, u_ProjMatrix, viewMatrix, u_NormalMatrix, normalMatrix);
      //  draw(gl, currentAngle, currentAngle1, u_ViewMatrix, u_ProjMatrix, viewMatrix, u_NormalMatrix, normalMatrix); // Draw the triangles
        requestAnimationFrame(tick, canvas);
        // Request that the browser re-draw the webpage
        // (causes webpage to endlessly re-draw itself)
    };
    tick(); // start (and continue) animation: draw current image
}
//basic shapes
function makeColorShapes() {
  forestVerts = new Float32Array([
      //炮
      //up
      6.0, 0.5, 0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //0
      6.0, 0.5, -0.5, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      0.0, 0.5, -0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //2

      6.0, 0.5, 0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //0
      0.0, 0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      0.0, 0.5, -0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //2

      //right
      6.0, 0.5, -0.5, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      6.0, 0.5, 0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //0
      6.0, -0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      6.0, 0.5, -0.5, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      6.0, -0.5, -0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //5
      6.0, -0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      //back
      0.0, 0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      6.0, 0.5, 0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //0
      6.0, -0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      0.0, 0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      0.0, -0.5, 0.5, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //6
      6.0, -0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      //left
      0.0, 0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      0.0, 0.5, -0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //2
      0.0, -0.5, -0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7

      0.0, 0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      0.0, -0.5, 0.5, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //6
      0.0, -0.5, -0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7

      //front
      6.0, 0.5, -0.5, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      0.0, 0.5, -0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //2
      0.0, -0.5, -0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7

      6.0, 0.5, -0.5, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      6.0, -0.5, -0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //5
      0.0, -0.5, -0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7

      //bottom
      0.0, -0.5, -0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7
      0.0, -0.5, 0.5, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //6
      6.0, -0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      0.0, -0.5, -0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7
      6.0, -0.5, -0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //5
      6.0, -0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      //下半身
      //up
      1.0, 0.5, 1.0, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //0
      1.0, 0.5, -1.0, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      -1.0, 0.5, -1.0, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //2

      1.0, 0.5, 1.0, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //0
      -1.0, 0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      -1.0, 0.5, -1.0, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //2

      //right
      1.0, 0.5, -1.0, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      1.0, 0.5, 1.0, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //0
      0.7, -0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      1.0, 0.5, -1.0, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      0.7, -0.5, -1.0, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //5
      0.7, -0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      //back
      -1.0, 0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      1.0, 0.5, 1.0, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //0
      0.7, -0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      -1.0, 0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      -0.7, -0.5, 1.0, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //6
      0.7, -0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      //left
      -1.0, 0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      -1.0, 0.5, -1.0, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //2
      -0.7, -0.5, -1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7

      -1.0, 0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      -0.7, -0.5, 1.0, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //6
      -0.7, -0.5, -1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7

      //front
      1.0, 0.5, -1.0, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      -1.0, 0.5, -1.0, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //2
      -0.7, -0.5, -1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7

      1.0, 0.5, -1.0, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      0.7, -0.5, -1.0, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //5
      -0.7, -0.5, -1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7

      //bottom
      -0.7, -0.5, -1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7
      -0.7, -0.5, 1.0, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //6
      0.7, -0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      -0.7, -0.5, -1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7
      0.7, -0.5, -1.0, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //5
      0.7, -0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      //上半身
      //up
      0.5, 0.5, 0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //0
      0.5, 0.5, -0.5, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      -0.5, 0.5, -0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //2

      0.5, 0.5, 0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //0
      -0.5, 0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      -0.5, 0.5, -0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //2

      //right
      0.5, 0.5, -0.5, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      0.5, 0.5, 0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //0
      1.0, -0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      0.5, 0.5, -0.5, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      1.0, -0.5, -1.0, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //5
      1.0, -0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      //back
      -0.5, 0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      0.5, 0.5, 0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //0
      1.0, -0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      -0.5, 0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      -1.0, -0.5, 1.0, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //6
      1.0, -0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      //left
      -0.5, 0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      -0.5, 0.5, -0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //2
      -1.0, -0.5, -1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7

      -0.5, 0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      -1.0, -0.5, 1.0, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //6
      -1.0, -0.5, -1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7

      //front
      0.5, 0.5, -0.5, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      -0.5, 0.5, -0.5, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //2
      -1.0, -0.5, -1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7

      0.5, 0.5, -0.5, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //1
      1.0, -0.5, -1.0, 1.0, 0.641, 0.641, 0.07, 0.0, 0.0, 0.0, //5
      -1.0, -0.5, -1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7

      //bottom
      -1.0, -0.5, -1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7
      -1.0, -0.5, 1.0, 1.0, 0.176, 0.176, 0.176, 0.0, 0.0, 0.0, //6
      1.0, -0.5, 1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //4

      -1.0, -0.5, -1.0, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //7
      1.0, -0.5, -1.0, 1.0, 0.641, 0.641, 0.07,  0.0, 0.0, 0.0, //5
      1.0, -0.5, 1.0, 1.0, 0.101, 0.468, 0.07,   0.0, 0.0, 0.0, //4

      //108:
      //wing 1
      0.25, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0,  0.0, 0.0, 0.0, //1
      -0.25, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, //2
      0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0,   0.0, 0.0, 0.0, //3
      //wing 2
      0.25, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0,   0.0, 0.0, 0.0, //1
      -0.25, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  0.0, 0.0, 0.0, //2
      -0.25, 0.0, -1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, //3
      //month
      0.0, 0.0, 0.0, 1.0, 0.64, 0.36, 0.136,   0.0, 0.0, 0.0, //1
      -0.5, 0.0, 0.0, 1.0, 0.36, 0.64, 0.136,  0.0, 0.0, 0.0, //2
      -0.25, -1.0, 0.0, 1.0, 0.36, 0.36, 0.64, 0.0, 0.0, 0.0, //3



      //axes(117-2-x-axe)
      0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, //x
      1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, //x

      //axes(119-2-y-axe)
      0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, //y
      0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, //y

      //axes(121-2-z-axe)
      0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, //z
      0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, //z

      //cube (123 - 36)  // back
      0, 1, 1, 1,   0.0, 0.0, 1.0,  0, 1, 0,  //3
      1, 1, 1, 1,   0.0, 0.0, 1.0,  0, 1, 0,  //2
      0, 1, 0, 1,   0.0, 0.0, 1.0,  0, 1, 0,  //6

      1, 1, 1, 1,   0.0, 0.0, 1.0,  0, 1, 0,  //2
      0, 1, 0, 1,   0.0, 0.0, 1.0,  0, 1, 0,  //6
      1, 1, 0, 1,   0.0, 0.0, 1.0,  0, 1, 0,  //7

      //right
      1, 1, 0, 1,   0.0, 1.0, 0.0,  1, 0, 0,  //7
      1, 1, 1, 1,   0.0, 1.0, 0.0,  1, 0, 0,//2
      1, 0, 0, 1,   0.0, 1.0, 0.0,  1, 0, 0,//5

      1, 1, 1, 1,   0.0, 1.0, 0.0,  1, 0, 0,//2
      1, 0, 0, 1,   0.0, 1.0, 0.0,  1, 0, 0,//5
      1, 0, 1, 1,   0.0, 1.0, 0.0,  1, 0, 0, //1

      //bottom
      1, 1, 0, 1,   1.0, 0.0, 0.0,  0, 0, -1,//7
      0, 1, 0, 1,   1.0, 0.0, 0.0,  0, 0, -1,//6
      1, 0, 0, 1,   1.0, 0.0, 0.0,  0, 0, -1,//5

      0, 1, 0, 1,   1.0, 0.0, 0.0,  0, 0, -1,//6
      1, 0, 0, 1,   1.0, 0.0, 0.0,  0, 0, -1,//5
      0, 0, 0, 1,   1.0, 0.0, 0.0,  0, 0, -1, //4

      //left
      0, 1, 0, 1,   0.0, 1.0, 0.0,  -1, 0, 0,//6
      0, 1, 1, 1,   0.0, 1.0, 0.0,  -1, 0, 0, //3
      0, 0, 0, 1,   0.0, 1.0, 0.0,  -1, 0, 0,//4

      0, 1, 1, 1,   0.0, 1.0, 0.0,  -1, 0, 0,//3
      0, 0, 0, 1,   0.0, 1.0, 0.0,  -1, 0, 0,//4
      0, 0, 1, 1,   0.0, 1.0, 0.0,  -1, 0, 0, //0

      //top
      0, 1, 1, 1,   1.0, 0.0, 0.0,  0, 0, 1,//3
      1, 1, 1, 1,   1.0, 0.0, 0.0,  0, 0, 1,//2
      1, 0, 1, 1,   1.0, 0.0, 0.0,  0, 0, 1,//1

      0, 1, 1, 1,   1.0, 0.0, 0.0,  0, 0, 1,//3
      1, 0, 1, 1,   1.0, 0.0, 0.0,  0, 0, 1,//1
      0, 0, 1, 1,   1.0, 0.0, 0.0,  0, 0, 1, //0

      //front
      0, 0, 1, 1,   0.0, 0.0, 1.0,  0, -1, 0,//0
      1, 0, 1, 1,   0.0, 0.0, 1.0,  0, -1, 0,//1
      0, 0, 0, 1,   0.0, 0.0, 1.0,  0, -1, 0,//4

      0, 0, 0, 1,   0.0, 0.0, 1.0,  0, -1, 0,//4
      1, 0, 1, 1,   0.0, 0.0, 1.0,  0, -1, 0,//1
      1, 0, 0, 1,   0.0, 0.0, 1.0,  0, -1, 0, //5


      //bird body(159 - 36)
      //up
      6.0, 0.5, 0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //0
      6.0, 0.5, -0.5, 1.0, 1, 0, 1, 0.0, 0.0, 0.0, //1
      0.0, 0.5, -0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //2

      6.0, 0.5, 0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //0
      0.0, 0.5, 0.5, 1.0, 0.92, 0.66, 0.66, 0.0, 0.0, 0.0, //3
      0.0, 0.5, -0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //2

      //right
      6.0, 0.5, -0.5, 1.0, 1, 0, 1, 0.0, 0.0, 0.0, //1
      6.0, 0.5, 0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //0
      6.0, -0.5, 0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //4

      6.0, 0.5, -0.5, 1.0, 1, 0, 1, 0.0, 0.0, 0.0, //1
      6.0, -0.5, -0.5, 1.0, 0.92, 0.66, 0.66, 0.0, 0.0, 0.0, //5
      6.0, -0.5, 0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //4

      //back
      0.0, 0.5, 0.5, 1.0, 0.101, 0.468, 0.07, 0.0, 0.0, 0.0, //3
      6.0, 0.5, 0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //0
      6.0, -0.5, 0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //4

      0.0, 0.5, 0.5, 1.0, 0.92, 0.66, 0.66, 0.0, 0.0, 0.0, //3
      0.0, -0.5, 0.5, 1.0, 1, 0, 1, 0.0, 0.0, 0.0, //6
      6.0, -0.5, 0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //4

      //left
      0.0, 0.5, 0.5, 1.0, 0.92, 0.66, 0.66, 0.0, 0.0, 0.0, //3
      0.0, 0.5, -0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //2
      0.0, -0.5, -0.5, 1.0, 0.92, 0.66, 0.66, 0.0, 0.0, 0.0, //7

      0.0, 0.5, 0.5, 1.0, 0.92, 0.66, 0.66, 0.0, 0.0, 0.0, //3
      0.0, -0.5, 0.5, 1.0, 1, 0, 1, 0.0, 0.0, 0.0, //6
      0.0, -0.5, -0.5, 1.0, 1, 0, 1, 0.0, 0.0, 0.0, //7

      //front
      6.0, 0.5, -0.5, 1.0, 1, 0, 1, 0.0, 0.0, 0.0, //1
      0.0, 0.5, -0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //2
      0.0, -0.5, -0.5, 1.0, 1, 0, 1, 0.0, 0.0, 0.0, //7

      6.0, 0.5, -0.5, 1.0, 1, 0, 1, 0.0, 0.0, 0.0, //1
      6.0, -0.5, -0.5, 1.0, 0.92, 0.66, 0.66, 0.0, 0.0, 0.0, //5
      0.0, -0.5, -0.5, 1.0, 1, 0, 1, 0.0, 0.0, 0.0, //7

      //bottom
      0.0, -0.5, -0.5, 1.0, 0.92, 0.66, 0.66, 0.0, 0.0, 0.0, //7
      0.0, -0.5, 0.5, 1.0, 1, 0, 1, 0.0, 0.0, 0.0, //6
      6.0, -0.5, 0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //4

      0.0, -0.5, -0.5, 1.0, 1, 0, 1, 0.0, 0.0, 0.0, //7
      6.0, -0.5, -0.5, 1.0, 0.92, 0.66, 0.66, 0.0, 0.0, 0.0, //5
      6.0, -0.5, 0.5, 1.0, 1, 0, 0, 0.0, 0.0, 0.0, //4


      //=======pyramid===(195 - 24)
      1.0, 0.0, 0.0, 1.0,   1.0, 1.0, 1.0,     0.0, 0.0, 0.0, //1
      0.0, 0.0, 1.0, 1.0,   0.5, 1.0, 0.5,     0.0, 0.0, 0.0, //2
      0.0, 1.0, 0.0, 1.0,   1.0, 1.0, 0.5,     0.0, 0.0, 0.0, //3

      -1.0, 0.0, 0.0, 1.0,    1.0, 1.0, 0.0,    0.0, 0.0, 0.0, //4
      0.0, 0.0, 1.0, 1.0,     0.5, 1.0, 0.5,    0.0, 0.0, 0.0, //2
      0.0, 1.0, 0.0, 1.0,     1.0, 1.0, 0.5,    0.0, 0.0, 0.0, //3

      -1.0, 0.0, 0.0, 1.0,    1.0, 1.0, 0.0,     0.0, 0.0, 0.0, //4
      0.0, 0.0, -1.0, 1.0,    0.0, 1.0, 0.0,     0.0, 0.0, 0.0, //5
      0.0, 1.0, 0.0, 1.0,     1.0, 1.0, 0.5,     0.0, 0.0, 0.0, //3

      1.0, 0.0, 0.0, 1.0,     1.0, 1.0, 1.0,      0.0, 0.0, 0.0, //1
      0.0, 0.0, -1.0, 1.0,    0.0, 1.0, 0.0,      0.0, 0.0, 0.0, //5
      0.0, 1.0, 0.0, 1.0,     1.0, 1.0, 0.5,      0.0, 0.0, 0.0, //3

      1.0, 0.0, 0.0, 1.0,     0.6, 0.8, 1.0,      0.0, 0.0, 0.0, //1
      0.0, 0.0, 1.0, 1.0,     0.5, 1.0, 0.5,      0.0, 0.0, 0.0, //2
      0.0, -1.0, 0.0, 1.0,    0.5, 0.0, 0.5,      0.0, 0.0, 0.0, //6

      -1.0, 0.0, 0.0, 1.0,    1.0, 1.0, 0.0,      0.0, 0.0, 0.0, //4
      0.0, 0.0, 1.0, 1.0,     0.5, 1.0, 0.5,      0.0, 0.0, 0.0, //2
      0.0, -1.0, 0.0, 1.0,    0.5, 0.0, 0.5,      0.0, 0.0, 0.0, //6

      -1.0, 0.0, 0.0, 1.0,    1.0, 1.0, 0.0,        0.0, 0.0, 0.0, //4
      0.0, 0.0, -1.0, 1.0,    0.0, 1.0, 0.0,        0.0, 0.0, 0.0, //5
      0.0, -1.0, 0.0, 1.0,    0.5, 0.0, 0.5,        0.0, 0.0, 0.0, //6

      1.0, 0.0, 0.0, 1.0,     1.0, 1.0, 1.0,       0.0, 0.0, 0.0, //1
      0.0, 0.0, -1.0, 1.0,    0.0, 1.0, 0.0,       0.0, 0.0, 0.0, //5
      0.0, -1.0, 0.0, 1.0,    0.5, 0.0, 0.5,       0.0, 0.0, 0.0, //6
  ]);
}
//cone
function makeCylinder() {
    //==============================================================================
    // Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
    // 'stepped spiral' design described in notes.
    // Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
    //
    var ctrColr = new Float32Array([0.2, 0.2, 0.2]); // dark gray
    var topColr = new Float32Array([0.4, 0.7, 0.4]); // light green
    var botColr = new Float32Array([0.5, 0.5, 1.0]); // light blue
    var capVerts = 16; // # of vertices around the topmost 'cap' of the shape
    var botRadius = 0.0; // radius of bottom of cylinder (top always 1.0)

    // Create a (global) array to hold this cylinder's vertices;
    cylVerts = new Float32Array(((capVerts * 6) - 2) * floatsPerVertex);
    // # of vertices * # of elements needed to store them.

    // Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
    // v counts vertices: j counts array elements (vertices * elements per vertex)
    for (v = 1, j = 0; v < 2 * capVerts; v++, j += floatsPerVertex) {
        // skip the first vertex--not needed.
        if (v % 2 === 0) { // put even# vertices at center of cylinder's top cap:
            cylVerts[j] = 0.0; // x,y,z,w == 0,0,1,1
            cylVerts[j + 1] = 0.0;
            cylVerts[j + 2] = 1.0;
            cylVerts[j + 3] = 1.0; // r,g,b = topColr[]
            cylVerts[j + 4] = ctrColr[0];
            cylVerts[j + 5] = ctrColr[1];
            cylVerts[j + 6] = ctrColr[2];
            // cylVerts[j + 7] = 0.0;
            // cylVerts[j + 8] = 0.0;
            // cylVerts[j + 9] = 0.0;
        } else { // put odd# vertices around the top cap's outer edge;
            // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
            // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
            cylVerts[j] = Math.cos(Math.PI * (v - 1) / capVerts); // x
            cylVerts[j + 1] = Math.sin(Math.PI * (v - 1) / capVerts); // y
            //	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
            //	 can simplify cos(2*PI * (v-1)/(2*capVerts))
            cylVerts[j + 2] = 1.0; // z
            cylVerts[j + 3] = 1.0; // w.
            // r,g,b = topColr[]
            cylVerts[j + 4] = topColr[0];
            cylVerts[j + 5] = topColr[1];
            cylVerts[j + 6] = topColr[2];
            // cylVerts[j + 7] = 0.0;
            // cylVerts[j + 8] = 0.0;
            // cylVerts[j + 9] = 0.0;
        }
    }
    // Create the cylinder side walls, made of 2*capVerts vertices.
    // v counts vertices within the wall; j continues to count array elements
    for (v = 0; v < 2 * capVerts; v++, j += floatsPerVertex) {
        if (v % 2 === 0) // position all even# vertices along top cap:
        {
            cylVerts[j] = Math.cos(Math.PI * (v) / capVerts); // x
            cylVerts[j + 1] = Math.sin(Math.PI * (v) / capVerts); // y
            cylVerts[j + 2] = 1.0; // z
            cylVerts[j + 3] = 1.0; // w.
            // r,g,b = topColr[]
            cylVerts[j + 4] = topColr[0];
            cylVerts[j + 5] = topColr[1];
            cylVerts[j + 6] = topColr[2];
            // cylVerts[j + 7] = 0.0;
            // cylVerts[j + 8] = 0.0;
            // cylVerts[j + 9] = 0.0;
        } else // position all odd# vertices along the bottom cap:
        {
            cylVerts[j] = botRadius * Math.cos(Math.PI * (v - 1) / capVerts); // x
            cylVerts[j + 1] = botRadius * Math.sin(Math.PI * (v - 1) / capVerts); // y
            cylVerts[j + 2] = -1.0; // z
            cylVerts[j + 3] = 1.0; // w.
            // r,g,b = topColr[]
            cylVerts[j + 4] = botColr[0];
            cylVerts[j + 5] = botColr[1];
            cylVerts[j + 6] = botColr[2];
            // cylVerts[j + 7] = 0.0;
            // cylVerts[j + 8] = 0.0;
            // cylVerts[j + 9] = 0.0;
        }
    }
    // Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
    // v counts the vertices in the cap; j continues to count array elements
    for (v = 0; v < (2 * capVerts - 1); v++, j += floatsPerVertex) {
        if (v % 2 === 0) { // position even #'d vertices around bot cap's outer edge
            cylVerts[j] = botRadius * Math.cos(Math.PI * (v) / capVerts); // x
            cylVerts[j + 1] = botRadius * Math.sin(Math.PI * (v) / capVerts); // y
            cylVerts[j + 2] = -1.0; // z
            cylVerts[j + 3] = 1.0; // w.
            // r,g,b = topColr[]
            cylVerts[j + 4] = botColr[0];
            cylVerts[j + 5] = botColr[1];
            cylVerts[j + 6] = botColr[2];
            // cylVerts[j + 7] = 0.0;
            // cylVerts[j + 8] = 0.0;
            // cylVerts[j + 9] = 0.0;
        } else { // position odd#'d vertices at center of the bottom cap:
            cylVerts[j] = 0.0; // x,y,z,w == 0,0,-1,1
            cylVerts[j + 1] = 0.0;
            cylVerts[j + 2] = -1.0;
            cylVerts[j + 3] = 1.0; // r,g,b = botColr[]
            cylVerts[j + 4] = botColr[0];
            cylVerts[j + 5] = botColr[1];
            cylVerts[j + 6] = botColr[2];
            // cylVerts[j + 7] = 0.0;
            // cylVerts[j + 8] = 0.0;
            // cylVerts[j + 9] = 0.0;
        }
    }
}

function makeSphere() {
    //==============================================================================
    // Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like
    // equal-lattitude 'slices' of the sphere (bounded by planes of constant z),
    // and connect them as a 'stepped spiral' design (see makeCylinder) to build the
    // sphere from one triangle strip.
    var slices = 13; // # of slices of the sphere along the z axis. >=3 req'd
    // (choose odd # or prime# to avoid accidental symmetry)
    var sliceVerts = 27; // # of vertices around the top edge of the slice
    // (same number of vertices on bottom of slice, too)
    var topColr = new Float32Array([1.0, 0.0, 1.0]); // North Pole: light gray
    var equColr = new Float32Array([0.0, 1.0, 1.0]); // Equator:    bright green
    var botColr = new Float32Array([1.0, 1.0, 0.0]); // South Pole: brightest gray.
    var sliceAngle = Math.PI / slices; // lattitude angle spanned by one slice.

    // Create a (global) array to hold this sphere's vertices:
    sphVerts = new Float32Array(((slices * 2 * sliceVerts) - 2) * floatsPerVertex);
    // # of vertices * # of elements needed to store them.
    // each slice requires 2*sliceVerts vertices except 1st and
    // last ones, which require only 2*sliceVerts-1.

    // Create dome-shaped top slice of sphere at z=+1
    // s counts slices; v counts vertices;
    // j counts array elements (vertices * elements per vertex)
    var cos0 = 0.0; // sines,cosines of slice's top, bottom edge.
    var sin0 = 0.0;
    var cos1 = 0.0;
    var sin1 = 0.0;
    var j = 0; // initialize our array index
    var isLast = 0;
    var isFirst = 1;
    for (s = 0; s < slices; s++) { // for each slice of the sphere,
        // find sines & cosines for top and bottom of this slice
        if (s == 0) {
            isFirst = 1; // skip 1st vertex of 1st slice.
            cos0 = 1.0; // initialize: start at north pole.
            sin0 = 0.0;
        } else { // otherwise, new top edge == old bottom edge
            isFirst = 0;
            cos0 = cos1;
            sin0 = sin1;
        } // & compute sine,cosine for new bottom edge.
        cos1 = Math.cos((s + 1) * sliceAngle);
        sin1 = Math.sin((s + 1) * sliceAngle);
        // go around the entire slice, generating TRIANGLE_STRIP verts
        // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
        if (s == slices - 1) isLast = 1; // skip last vertex of last slice.
        for (v = isFirst; v < 2 * sliceVerts - isLast; v++, j += floatsPerVertex) {
            if (v % 2 == 0) { // put even# vertices at the the slice's top edge
                // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
                // and thus we can simplify cos(2*PI(v/2*sliceVerts))
                sphVerts[j] = sin0 * Math.cos(Math.PI * (v) / sliceVerts);
                sphVerts[j + 1] = sin0 * Math.sin(Math.PI * (v) / sliceVerts);
                sphVerts[j + 2] = cos0;
                sphVerts[j + 3] = 1.0;
            } else { // put odd# vertices around the slice's lower edge;
                // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
                sphVerts[j] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts); // x
                sphVerts[j + 1] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts); // y
                sphVerts[j + 2] = cos1; // z
                sphVerts[j + 3] = 1.0; // w.
            }
            if (s == 0) { // finally, set some interesting colors for vertices:
                sphVerts[j + 4] = topColr[0];
                sphVerts[j + 5] = topColr[1];
                sphVerts[j + 6] = topColr[2];
            } else if (s == slices - 1) {
                sphVerts[j + 4] = botColr[0];
                sphVerts[j + 5] = botColr[1];
                sphVerts[j + 6] = botColr[2];
            } else {
                sphVerts[j + 4] = 188 / 256; // equColr[0];
                sphVerts[j + 5] = 168 / 256; // equColr[1];
                sphVerts[j + 6] = 6 / 256; // equColr[2];
            }
        }
    }
}

function makeTorus() {

    var rbend = 1.0; // Radius of circle formed by torus' bent bar
    var rbar = 0.5; // radius of the bar we bent to form torus
    var barSlices = 23; // # of bar-segments in the torus: >=3 req'd;																	// more segments for more-circular torus
    var barSides = 13; // # of sides o
    torVerts = new Float32Array(floatsPerVertex * (2 * barSides * barSlices + 2));
    //	Each slice requires 2*barSides vertices, but 1st slice will skip its first
    // triangle and last slice will skip its last triangle. To 'close' the torus,
    // repeat the first 2 vertices at the end of the triangle-strip.  Assume 7

    var phi = 0,
        theta = 0; // begin torus at angles 0,0
    var thetaStep = 2 * Math.PI / barSlices; // theta angle between each bar segment
    var phiHalfStep = Math.PI / barSides; // half-phi angle between each side of bar
    // (WHY HALF? 2 vertices per step in phi)
    // s counts slices of the bar; v counts vertices within one slice; j counts
    // array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
    for (s = 0, j = 0; s < barSlices; s++) { // for each 'slice' or 'ring' of the torus:
        for (v = 0; v < 2 * barSides; v++, j += 10) { // for each vertex in this slice:
            if (v % 2 == 0) { // even #'d vertices at bottom of slice,
                torVerts[j] = (rbend + rbar * Math.cos((v) * phiHalfStep)) *
                    Math.cos((s) * thetaStep);
                //	x = (rbend + rbar*cos(phi)) * cos(theta)
                torVerts[j + 1] = (rbend + rbar * Math.cos((v) * phiHalfStep)) *
                    Math.sin((s) * thetaStep);
                //  y = (rbend + rbar*cos(phi)) * sin(theta)
                torVerts[j + 2] = -rbar * Math.sin((v) * phiHalfStep);
                //  z = -rbar  *   sin(phi)
                torVerts[j + 3] = 1.0; // w
            } else { // odd #'d vertices at top of slice (s+1);
                // at same phi used at bottom of slice (v-1)
                torVerts[j] = (rbend + rbar * Math.cos((v - 1) * phiHalfStep)) *
                    Math.cos((s + 1) * thetaStep);
                //	x = (rbend + rbar*cos(phi)) * cos(theta)
                torVerts[j + 1] = (rbend + rbar * Math.cos((v - 1) * phiHalfStep)) *
                    Math.sin((s + 1) * thetaStep);
                //  y = (rbend + rbar*cos(phi)) * sin(theta)
                torVerts[j + 2] = -rbar * Math.sin((v - 1) * phiHalfStep);
                //  z = -rbar  *   sin(phi)
                torVerts[j + 3] = 1.0; // w
            }
            torVerts[j + 4] = 0.4; // random color 0.0 <= R < 1.0
            torVerts[j + 5] = 0.1; // random color 0.0 <= G < 1.0
            torVerts[j + 6] = 0.1; // random color 0.0 <= B < 1.0
            torVerts[j + 7] = 0.0;
            torVerts[j + 8] = 0.0;
            torVerts[j + 9] = 0.0;
        }
    }
    // Repeat the 1st 2 vertices of the triangle strip to complete the torus:
    torVerts[j] = rbend + rbar; // copy vertex zero;
    //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
    torVerts[j + 1] = 0.0;
    //  y = (rbend + rbar*cos(phi==0)) * sin(theta==0)
    torVerts[j + 2] = 0.0;
    //  z = -rbar  *   sin(phi==0)
    torVerts[j + 3] = 1.0; // w
    torVerts[j + 4] = Math.random(); // random color 0.0 <= R < 1.0
    torVerts[j + 5] = Math.random(); // random color 0.0 <= G < 1.0
    torVerts[j + 6] = Math.random(); // random color 0.0 <= B < 1.0
    torVerts[j + 7] = 0.0;
    torVerts[j + 8] = 0.0;
    torVerts[j + 9] = 0.0;
    j += 10; // go to next vertex:
    torVerts[j] = (rbend + rbar) * Math.cos(thetaStep);
    //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
    torVerts[j + 1] = (rbend + rbar) * Math.sin(thetaStep);
    //  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep)
    torVerts[j + 2] = 0.0;
    //  z = -rbar  *   sin(phi==0)
    torVerts[j + 3] = 10.0; // w
    torVerts[j + 4] = Math.random(); // random color 0.0 <= R < 1.0
    torVerts[j + 5] = Math.random(); // random color 0.0 <= G < 1.0
    torVerts[j + 6] = Math.random(); // random color 0.0 <= B < 1.0
    torVerts[j + 7] = 0.0;
    torVerts[j + 8] = 0.0;
    torVerts[j + 9] = 0.0;
}

function makeGroundGrid() {
    //==============================================================================
    // Create a list of vertices that create a large grid of lines in the x,y plane
    // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

    var xcount = 100; // # of lines to draw in x,y to make the grid.
    var ycount = 100;
    var xymax = 50.0; // grid size; extends to cover +/-xymax in x and y.
    var xColr = new Float32Array([0.8, 0.8, 0.8]); // bright yellow
    var yColr = new Float32Array([0.8, 0.8, 0.8]); // bright green.

    // Create an (global) array to hold this ground-plane's vertices:
    gndVerts = new Float32Array(floatsPerVertex * 2 * (xcount + ycount));
    // draw a grid made of xcount+ycount lines; 2 vertices per line.

    var xgap = xymax / (xcount - 1); // HALF-spacing between lines in x,y;
    var ygap = xymax / (ycount - 1); // (why half? because v==(0line number/2))

    // First, step thru x values as we make vertical lines of constant-x:
    for (v = 0, j = 0; v < 2 * xcount; v++, j += floatsPerVertex) {
        if (v % 2 == 0) { // put even-numbered vertices at (xnow, -xymax, 0)
            gndVerts[j] = -xymax + (v) * xgap; // x
            gndVerts[j + 1] = -xymax; // y
            gndVerts[j + 2] = 0.0; // z
        } else { // put odd-numbered vertices at (xnow, +xymax, 0).
            gndVerts[j] = -xymax + (v - 1) * xgap; // x
            gndVerts[j + 1] = xymax; // y
            gndVerts[j + 2] = 0.0; // z
        }
        gndVerts[j + 3] = xColr[0]; // red
        gndVerts[j + 4] = xColr[1]; // grn
        gndVerts[j + 5] = xColr[2]; // blu
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for (v = 0; v < 2 * ycount; v++, j += floatsPerVertex) {
        if (v % 2 == 0) { // put even-numbered vertices at (-xymax, ynow, 0)
            gndVerts[j] = -xymax; // x
            gndVerts[j + 1] = -xymax + (v) * ygap; // y
            gndVerts[j + 2] = 0.0; // z
        } else { // put odd-numbered vertices at (+xymax, ynow, 0).
            gndVerts[j] = xymax; // x
            gndVerts[j + 1] = -xymax + (v - 1) * ygap; // y
            gndVerts[j + 2] = 0.0; // z
        }
        gndVerts[j + 3] = yColr[0]; // red
        gndVerts[j + 4] = yColr[1]; // grn
        gndVerts[j + 5] = yColr[2]; // blu
    }
}

function initVertexBuffers(gl) {

    makeColorShapes();
    makeGroundGrid();
    makeSphere();
    makeTorus();
    makeCylinder();

    //space to store all the shapes
    mySiz = forestVerts.length + gndVerts.length + sphVerts.length + torVerts.length +
        cylVerts.length;

    //vertices total
    var nn = mySiz / floatsPerVertex;
    //console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);

    // Copy all shapes into one big Float32 array:
    var verticesColors = new Float32Array(mySiz);
    // Copy them:  remember where to start for each shape:
    forestStart = 0; //store the forest first.
    for (i = 0, j = 0; j < forestVerts.length; i++, j++) {
        verticesColors[i] = forestVerts[j];
    }
    gndStart = i; // next store the ground-plane;
    for (j = 0; j < gndVerts.length; i++, j++) {
        verticesColors[i] = gndVerts[j];
    }

    sphere_start = i;
    for (j = 0; j < sphVerts.length; i++, j++) {
        verticesColors[i] = sphVerts[j];
    }

    torStart = i; // next, we'll store the torus;
    for (j = 0; j < torVerts.length; i++, j++) {
        verticesColors[i] = torVerts[j];
    }
    //
    cylStart = i; // we stored the cylinder first.
    for (j = 0; j < cylVerts.length; i++, j++) {
        verticesColors[i] = cylVerts[j];
    }

    // Create a vertex buffer object (VBO)
    var vertexColorbuffer = gl.createBuffer();
    if (!vertexColorbuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Write vertex information to buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    // Assign the buffer object to a_Position and enable the assignment
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    // Use handle to specify how to retrieve position data from VBO
    gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE * 10, 0);
    gl.enableVertexAttribArray(a_Position);

    // Assign the buffer object to a_Color and enable the assignment
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    // Use handle to specify how to retrieve color data from VBO:
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 10, FSIZE * 4);
    gl.enableVertexAttribArray(a_Color);

    var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 10, FSIZE * 7);
    gl.enableVertexAttribArray(a_Normal);
    return mySiz / floatsPerVertex; // return # of vertices
}

function keydown(ev, gl, u_ViewMatrix, u_ProjMatrix, u_NormalMatrix, viewMatrix, normalMatrix) {
    //------------------------------------------------------
    //HTML calls this'Event handler' or 'callback function' when we press a key:
    var dx = g_EyeX - g_LookAtX;
    var dy = g_EyeY - g_LookAtY;
    var dz = g_EyeZ - g_LookAtZ;
    var ax = Math.sqrt(dx * dx + dy * dy);

    if (ev.keyCode == 39) { // right arrow
        g_EyeX -= 0.3 * dy / ax;
        g_EyeY += 0.3 * dx / ax;
        g_LookAtX -= 0.3 * dy / ax;
        g_LookAtY += 0.3 * dx / ax;
        console.log('eyeX=', g_EyeX, 'eyeY=', g_EyeY, 'eyeZ=', g_EyeZ);
    } else if (ev.keyCode == 37) { // left arrow
        g_EyeX += 0.3 * dy / ax;
        g_EyeY -= 0.3 * dx / ax;
        g_LookAtX += 0.3 * dy / ax;
        g_LookAtY -= 0.3 * dx / ax;
        console.log('eyeX=', g_EyeX, 'eyeY=', g_EyeY, 'eyeZ=', g_EyeZ);
    } else if (ev.keyCode == 38) { // up arrow
      g_LookAtX = g_LookAtX - 0.3 * (dx/ax);
      g_LookAtY = g_LookAtY - 0.3 * (dy/ax);
      g_LookAtZ = g_LookAtZ - 0.3 * (dz/ax);
      g_EyeX = g_EyeX - 0.3 * (dx/ax);
      g_EyeY = g_EyeY - 0.3 * (dy/ax);
      g_EyeZ = g_EyeZ - 0.3 * (dz/ax);
        console.log('eyeX=', g_EyeX, 'eyeY=', g_EyeY, 'eyeZ=', g_EyeZ);
    } else if (ev.keyCode == 40) { // down arrow
      g_EyeX = g_EyeX + 0.3 * (dx/ax);
      g_EyeY = g_EyeY + 0.3 * (dy/ax);
      g_EyeZ = g_EyeZ + 0.3 * (dz/ax);
      g_LookAtX = g_LookAtX + 0.3 * (dx/ax);
      g_LookAtY = g_LookAtY + 0.3 * (dy/ax);
      g_LookAtZ = g_LookAtZ + 0.3 * (dz/ax);
        console.log('eyeX=', g_EyeX, 'eyeY=', g_EyeY, 'eyeZ=', g_EyeZ);

    } else if (ev.keyCode == 65) {                                        // a
        if (camera == -1) {
            camera2 = -Math.acos(dx / ax) + LOOK_STEP;
        } else {
            camera2 += LOOK_STEP;
        }
        g_LookAtX = g_EyeX + ax * Math.cos(camera2);
        g_LookAtY = g_EyeY + ax * Math.sin(camera2);
        camera = 1;
        console.log('eyeX=', g_EyeX, 'eyeY=', g_EyeY, 'eyeZ=', g_EyeZ);
    } else if (ev.keyCode == 68) {                                          //d
        if (camera == -1) {
            camera2 = -Math.acos(dx / ax) + LOOK_STEP;
        } else {
            camera2 -= LOOK_STEP;
        }
        g_LookAtX = g_EyeX + ax * Math.cos(camera2);
        g_LookAtY = g_EyeY + ax * Math.sin(camera2);
        camera = 1;

        console.log('eyeX=', g_EyeX, 'eyeY=', g_EyeY, 'eyeZ=', g_EyeZ);
    } else if (ev.keyCode == 87) {                                    //w - look up
        g_LookAtZ += LOOK_STEP;
        console.log('eyeX=', g_EyeX, 'eyeY=', g_EyeY, 'eyeZ=', g_EyeZ);
    } else
    if (ev.keyCode == 83) {                                         //s-look down
        g_LookAtZ -= LOOK_STEP;
        console.log('eyeX=', g_EyeX, 'eyeY=', g_EyeY, 'eyeZ=', g_EyeZ);
    } else {
        return;
    } // Prevent the unnecessary drawing
    draw(gl, currentAngle, currentAngle1, u_ViewMatrix, u_ProjMatrix, viewMatrix, u_NormalMatrix, normalMatrix);
}

var g_EyeX = 0.00,
    g_EyeY = 7,
    g_EyeZ = 0.4;
var g_LookAtX = 0.0,
    g_LookAtY = 0.0,
    g_LookAtZ = 0.0;

function draw(gl, currentAngle, currentAngle1, u_ViewMatrix, u_ProjMatrix, viewMatrix, u_NormalMatrix, normalMatrix) {
    //==============================================================================

    // Clear <canvas> color AND DEPTH buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width / 2, canvas.height);
  //  projMatrix.setPerspective(20, 1, 1, 100);
    projMatrix.setPerspective(40, (0.5*canvas.width)/canvas.height, 1, 16);

    // Draw in the SECOND of several 'viewports'
    //------------------------------------------
    // but use a different 'view' matrix:
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,          //eye position
                         g_LookAtX, g_LookAtY, g_LookAtZ, //look at position
                         0, 0, 1);                        // upper vector
    // Pass the view projection matrix to our shaders:
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    // Draw the scene:
    drawMyScene(gl, currentAngle, currentAngle1, u_ViewMatrix, u_ProjMatrix, viewMatrix, u_NormalMatrix, normalMatrix);

    //the other one
    gl.viewport(canvas.width/2, 0, canvas.width/2, canvas.height);

  // projMatrix.setOrtho(-0.5*canvas.width/300, 0.5*canvas.width/300,          // left,right;
  //                   - canvas.height/300, canvas.height/300,          // bottom, top;
  //                   1, 20);       // near, far; (always >=0)
  //
  //  projMatrix.setOrtho(-0.5 * 5 * Math.tan(20) * canvas.width / canvas.height,         //left
  //                       0.5 * 5 * Math.tan(20) * canvas.width / canvas.height,                     //right
  //                       -5 * Math.tan(20),                      //bottom
  //                        5 * Math.tan(20),                         // top;
  //                       1, 16);                                   // near, far; (always >=0)

  projMatrix.setOrtho(-0.5  * Math.tan(20) * canvas.width / canvas.height,         //left
                       0.5  * Math.tan(20) * canvas.width / canvas.height,                     //right
                       - Math.tan(20),                      //bottom
                         Math.tan(20),                         // top;
                       1, 16);                                   // near, far; (always >=0)

    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,  // eye position
                        g_LookAtX, g_LookAtY, g_LookAtZ, // look at position
                        0, 0, 1);  // upper vector
    // Pass the view projection matrix to our shaders:
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    // Draw the scene:
    drawMyScene(gl, currentAngle, currentAngle1, u_ViewMatrix, u_ProjMatrix, viewMatrix, u_NormalMatrix, normalMatrix);
}

function drawMyScene(myGL, currentAngle, currentAngle1, myu_ViewMatrix, u_ProjMatrix, myViewMatrix, u_NormalMatrix, normalMatrix) {
    var skretchRadio = 0.75;
    myViewMatrix.translate(0.0, 0.0, -0.8);
    myViewMatrix.rotate(180, 0, 0, 1);
    normalMatrix.setInverseOf(myViewMatrix);
    normalMatrix.transpose();
    myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    myViewMatrix.scale(0.4 * skretchRadio, 0.4, 0.4);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.LINES, gndStart / floatsPerVertex, gndVerts.length / floatsPerVertex);

    pushMatrix(myViewMatrix);
    pushMatrix(myViewMatrix);
    pushMatrix(myViewMatrix);
    pushMatrix(myViewMatrix);
    pushMatrix(myViewMatrix);
    pushMatrix(myViewMatrix);
    pushMatrix(myViewMatrix);
    pushMatrix(myViewMatrix);
    pushMatrix(myViewMatrix);

    // //AXES-X
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.LINES, 117, 2);
    //AXES-Y
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.LINES, 119, 2);
    //AXES-Z
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.LINES, 121, 2);

    // lower part
    myViewMatrix = popMatrix();
    myViewMatrix.translate(-2.0, 2.0, 0.5);
    myViewMatrix.scale(1.5, 1.5, 1.0);
    myViewMatrix.rotate(90, 1, 0, 0);
    myViewMatrix.rotate(180, 0, 0, 1);
    myViewMatrix.rotate(180, 1, 0, 0);
    myViewMatrix.rotate(180, 0, 1, 0);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 36, 36);

    // upper part
    myViewMatrix = popMatrix();
    myViewMatrix.translate(-2.0, 2.0, 1.4);
    myViewMatrix.scale(0.8, 0.8, 0.8);
    myViewMatrix.rotate(90, 1, 0, 0);
    myViewMatrix.rotate(90, 0, 1, 0);
    myViewMatrix.rotate(currentAngle, 0, 1, 0);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 72, 36);

    //AXES-X
    myViewMatrix.scale(2, 2, 2);
    myViewMatrix.rotate(90, 0, 0, 1);
    myViewMatrix.rotate(90, 0, 1, 0);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.LINES, 117, 2);
    //AXES-Y
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.LINES, 119, 2);
    //AXES-Z
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.LINES, 121, 2);

    //cannon part I
    myViewMatrix = popMatrix();
    myViewMatrix.translate(-2.0, 2.0, 1.4);
    myViewMatrix.scale(0.4, 0.3, 0.3);
    myViewMatrix.rotate(currentAngle, 0, 0, 1);
    myViewMatrix.rotate(-currentAngle1, 0, 1, 0);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 0, 36);

    //cannon part II
    myViewMatrix.translate(6.5, 0, 0);
    myViewMatrix.rotate(90, 1, 0, 0);
    myViewMatrix.rotate(90, 0, 0, 1);
    myViewMatrix.rotate(currentAngle * 3, 0, 1, 0);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 72, 36);

    //===============bird======================================================
    //body
    // var birdPosition_x = 0.4;
    // var birdPosition_y = 0.5;
    // myViewMatrix.setTranslate(birdPosition_x + xMdragTot, birdPosition_y + yMdragTot, 0.0);
    myViewMatrix = popMatrix();
    myViewMatrix.scale(0.3, 0.3, -0.3); // convert to left-handed coord sys                                         // to match WebGL display canvas.
    //  myViewMatrix.translate(10.0 + xMdragTot * 10, 0.0 + yMdragTot * 10, -10.0  + yMdragTot * 10);
    myViewMatrix.translate(10.0, 0.0, -10.0);
    pushMatrix(myViewMatrix);
    pushMatrix(myViewMatrix);
    pushMatrix(myViewMatrix);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 159, 36);

    // neck
    myViewMatrix.scale(0.7, 0.7, 0.7);
    myViewMatrix.rotate(180, 0, 1, 0);
    myViewMatrix.rotate(currentAngle1 + 20, 0, -1, 0);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 159, 36);


    //  Draw bird_mouth
    myViewMatrix.scale(4, 4, 4);
    myViewMatrix.translate(1.7, 0.0, 0.2);
    myViewMatrix.rotate(90, 1, 0, 0);
    myViewMatrix.rotate(currentAngle1 + 20, 0, 0, 1);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 114, 3);
    //
    //tail
    myViewMatrix = popMatrix();
    myViewMatrix.scale(2, 2, 2);
    myViewMatrix.rotate(90, 0, 1, 0);
    myViewMatrix.translate(0.2, 0.0, 3.0);
    myViewMatrix.rotate(currentAngle1 + 20, 0, 1, 0);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 108, 3);


    // wing
    // myViewMatrix.setTranslate(birdPosition_x + xMdragTot, birdPosition_y + yMdragTot, 0.0); // 'set' means DISCARD old matrix,
    myViewMatrix = popMatrix();
    myViewMatrix.scale(6, 5, 3.5);
    myViewMatrix.translate(0.5, 0.0, 0.0);
    // myViewMatrix.scale(0.25, 0.5, -0.5);
    myViewMatrix.rotate(currentAngle1 * 3 + 45, 1, 0, 0);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 108, 3);
    //
    // another wing
    //  myViewMatrix.setTranslate(birdPosition_x + xMdragTot, birdPosition_y + yMdragTot, 0.0); // 'set' means DISCARD old matrix,
    myViewMatrix = popMatrix();
    myViewMatrix.scale(6, 5, 3.5);
    myViewMatrix.translate(0.5, 0.0, 0.0);
    myViewMatrix.rotate(180, 1, 0, 0);
    myViewMatrix.rotate(-currentAngle1 * 3 - 45, 1, 0, 0);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 111, 3);


    //draw a UFO
    //===============draw sphere==========
    myViewMatrix = popMatrix();
    myViewMatrix.scale(0.7, 0.7, 0.7);
    myViewMatrix.translate(-5, 0, 6);
    myViewMatrix.rotate(currentAngle * 10, 0, 0, 1);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLE_STRIP, // use this drawing primitive, and
                    sphere_start / floatsPerVertex, // start at this vertex number, and
                    sphVerts.length / floatsPerVertex);

    //  ===============draw torus==============================
    myViewMatrix = popMatrix();
    myViewMatrix.scale(0.7, 0.7, 0.7);
    myViewMatrix.translate(-5, 0, 6);
    myViewMatrix.rotate(currentAngle * 10, 0, 0, 1);
    pushMatrix(myViewMatrix);
    pushMatrix(myViewMatrix);
    pushMatrix(myViewMatrix);
    pushMatrix(myViewMatrix);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLE_STRIP, // use this drawing primitive, and
        torStart / floatsPerVertex, // start at this vertex number, and
        torVerts.length / floatsPerVertex); // draw this many vertices.

    //=============cone=============
    //cone1
    myViewMatrix = popMatrix();
    myViewMatrix.scale(0.4, 0.4, 0.2);
    myViewMatrix.translate(4.7, 0, 0);
    myViewMatrix.rotate(-90, 0, 1, 0);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLE_STRIP, // use this drawing primitive, and
        cylStart / floatsPerVertex, // start at this vertex number, and
        cylVerts.length / floatsPerVertex); // draw this many vertices.

    //cone2
    myViewMatrix = popMatrix();
    myViewMatrix.scale(0.4, 0.4, 0.2);
    myViewMatrix.translate(-4.7, 0, 0);
    myViewMatrix.rotate(90, 0, 1, 0);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLE_STRIP, // use this drawing primitive, and
        cylStart / floatsPerVertex, // start at this vertex number, and
        cylVerts.length / floatsPerVertex); // draw this many vertices.

    //cone3
    myViewMatrix = popMatrix();
    myViewMatrix.scale(0.4, 0.4, 0.2);
    myViewMatrix.translate(0, -4.7, 0);
    myViewMatrix.rotate(-90, 1, 0, 0);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLE_STRIP, // use this drawing primitive, and
        cylStart / floatsPerVertex, // start at this vertex number, and
        cylVerts.length / floatsPerVertex); // draw this many vertices.
    //
    //cone4
    myViewMatrix = popMatrix();
    myViewMatrix.scale(0.4, 0.4, 0.2);
    myViewMatrix.translate(0, 4.7, 0);
    myViewMatrix.rotate(90, 1, 0, 0);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLE_STRIP, // use this drawing primitive, and
        cylStart / floatsPerVertex, // start at this vertex number, and
        cylVerts.length / floatsPerVertex); // draw this many vertices.

    //    ==============light cube=======
    myViewMatrix = popMatrix();
  //  viewMatrix.set(projMatrix).multiply(viewMatrix);
    myViewMatrix.translate(-5, 0, 0);
    //myViewMatrix.rotate(90,1,0,0);
    myViewMatrix.rotate(currentAngle * 2, 0, 0, 1);
    normalMatrix.setInverseOf(myViewMatrix);
    normalMatrix.transpose();
    myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 123, 36);

    //=========ballon======
    // pyramid
    myViewMatrix = popMatrix();
    myViewMatrix.translate(2.0, 0.0, 1.0);
    myViewMatrix.rotate(currentAngle,0,0,1);
    quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w); // Quaternion-->Matrix
    myViewMatrix.concat(quatMatrix);                         // apply that matrix.
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 195, 24);

    //chain1
    myViewMatrix.scale(0.2, 0.2,0.1);
    myViewMatrix.translate(0.0, 0.0, -10.0);
    myViewMatrix.rotate(90,0,1,0);
    myViewMatrix.rotate(90,1,0,0);
    myViewMatrix.rotate(currentAngle1,0,0,1);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 159, 36);

    //chain2
    myViewMatrix.translate(6.0, 0.0, 0.0);
    myViewMatrix.rotate(currentAngle1 * 2 - 30,0,0,1);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 159, 36);

    //chain2
    myViewMatrix.translate(6.0, 0.0, 0.0);
    myViewMatrix.rotate(currentAngle1 * 2 - 30,0,0,1);
    myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
    myGL.drawArrays(myGL.TRIANGLES, 159, 36);

}
var g_last = Date.now();

function animate(angle) {
    //==============================================================================
    // Calculate the elapsed time
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;

    // Update the current rotation angle (adjusted by the elapsed time)
    //  limit the angle to move smoothly between +320 and 0 degrees:
    if (angle > 180.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
    if (angle < -180.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360;
}

function animate1(angle) {
    //==============================================================================
    // Calculate the elapsed time
    var elapsed1 = 10;

    // Update the current rotation angle (adjusted by the elapsed time)
    //  limit the angle to move smoothly between +320 and 0 degrees:
    if (angle > 25.0 && ANGLE_STEP1 > 0) ANGLE_STEP1 = -ANGLE_STEP1;
    if (angle < -5.0 && ANGLE_STEP1 < 0) ANGLE_STEP1 = -ANGLE_STEP1;
    var newAngle = angle + (ANGLE_STEP1 * elapsed1) / 1000.0;
    return newAngle %= 360;
}

function resetQuat() {
    // Called when user presses 'Reset' button on our webpage, just below the
    // 'Current Quaternion' display.
    var res = 5;
    qTot.clear();
    document.getElementById('QuatValue').innerHTML =
        '\t X=' + qTot.x.toFixed(res) +
        'i\t Y=' + qTot.y.toFixed(res) +
        'j\t Z=' + qTot.z.toFixed(res) +
        'k\t W=' + qTot.w.toFixed(res) +
        '<br>length=' + qTot.length().toFixed(res);
}

function myMouseDown(ev, gl, canvas) {
    //==============================================================================
    // Called when user PRESSES down any mouse button;
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left; // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
    var x = (xp - canvas.width / 2) / // move origin to center of canvas and
        (canvas.width / 2); // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height / 2) / //                     -1 <= y < +1.
        (canvas.height / 2);
    isDrag = true; // set our mouse-dragging flag
    xMclik = x; // record where mouse-dragging began
    yMclik = y;
}

function myMouseMove(ev, gl, canvas) {
    //==============================================================================
    // Called when user MOVES the mouse with a button already pressed down.
    if (isDrag === false) return; // IGNORE all mouse-moves except 'dragging'
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left; // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
    var x = (xp - canvas.width / 2) / // move origin to center of canvas and
        (canvas.width / 2); // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height / 2) / //                     -1 <= y < +1.
        (canvas.height / 2);
    xMdragTot += (x - xMclik); // Accumulate change-in-mouse-position,&
    yMdragTot += (y - yMclik);
    dragQuat(x - xMclik, y - yMclik);
    xMclik = x; // Make next drag-measurement from here.
    yMclik = y;
}

function myMouseUp(ev, gl, canvas) {
    //==============================================================================
    // Called when user RELEASES mouse button pressed previously.
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left; // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
    var x = (xp - canvas.width / 2) / // move origin to center of canvas and
        (canvas.width / 2); // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height / 2) / //                     -1 <= y < +1.
        (canvas.height / 2);
  //  console.log('myMouseUp  (CVV coords  ):  x, y=\t', x, ',\t', y);

    isDrag = false; // CLEAR our mouse-dragging flag, and
    // accumulate any final bit of mouse-dragging we did:
    xMdragTot += (x - xMclik);
    yMdragTot += (y - yMclik);
    dragQuat(x - xMclik, y - yMclik);
}

function dragQuat(xdrag, ydrag) {
    //==============================================================================
    // Called when user drags mouse by 'xdrag,ydrag' as measured in CVV coords.
    var res = 5;
    var qTmp = new Quaternion(0, 0, 0, 1);

    var dist = Math.sqrt(xdrag * xdrag + ydrag * ydrag);
    // console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
    qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist * 150.0);
    qTmp.multiply(qNew, qTot); // apply new rotation to current rotation.
    qTot.copy(qTmp);
}

function drawResize(currentAngle, currentAngle1, u_ViewMatrix, u_ProjMatrix, viewMatrix, u_NormalMatrix, normalMatrix) {
    //==============================================================================
    // Called when user re-sizes their browser window , because our HTML file
    // contains:  <body onload="main()" onresize="winResize()">

    var nuCanvas = document.getElementById('webgl'); // get current canvas
    var nuGL = getWebGLContext(nuCanvas); // and context:

    //Report our current browser-window contents:

    console.log('nuCanvas width,height=', nuCanvas.width, nuCanvas.height);
    console.log('Browser window: innerWidth,innerHeight=',
        innerWidth, innerHeight); // http://www.w3schools.com/jsref/obj_window.asp


    //Make canvas fill the top 3/4 of our browser window:
    nuCanvas.width = innerWidth;
    nuCanvas.height = innerHeight * 3 / 4;
    // IMPORTANT!  Need a fresh drawing in the re-sized viewports.
    draw(nuGL, currentAngle, currentAngle1, u_ViewMatrix, u_ProjMatrix, viewMatrix, u_NormalMatrix, normalMatrix); // draw in all viewports.
}

resize = function(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

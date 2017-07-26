// Vertex shader program----------------------------------
var VSHADER_SOURCE =
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE =
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variable -- Rotation angle rate (degrees/second)
var ANGLE_STEP = 45.0;
var ANGLE_STEP1 = 45.0;
var ANGLE_STEP2 = 45.0;
var MOVE_STEP = 0;
var SPEED
var floatsPerVertex = 7;
var SPEED_STEP = 0.2;

var tank_switch = false;
var bird_on = true;

var distanceX = 0.0;
var distanceX_1 = 100.0;
var distanceY = 0.0;
var distanceY_1 = 100.0;
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;
var windowSize = 0;
var positionX = 0;
var positionY = 0;

var X = 0;
var Y = 0;
var color_var = 0.1;

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
//    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
  //  console.log('Failed to intialize shaders.');
    return;
  }

  //
  // var n = initVertexBuffer(gl);
  // if (n < 0) {
  //   console.log('Failed to set the vertex information');
  //   return;
//  }
  gl.clearColor(0.2, 0.5, 0.7, 1.0);
  // Specify the color for clearing <canvas>


	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST);


  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
//    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript
  var modelMatrix = new Matrix4();

  canvas.onmousedown = function(ev){myMouseDown(ev, gl, canvas)}; //set up mouse listener.
  canvas.onmousemove =  function(ev){myMouseMove(ev, gl, canvas)};
  canvas.onmouseup = function(ev){myMouseUp(ev, gl, canvas)};
  // Create, init current rotation angle value in JavaScript

  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("keyup", myKeyUp, false);
  window.addEventListener("keypress", myKeyPress, false);


  var currentAngle = 0.0;
  var currentAngle1 = 0.0;
  var currentAngle2 = 0.0;
  var currentAngle_zero = 0.0;
//  var currentAngle_bird = 0.0;
//-----------------

  // Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
    currentAngle = animate(currentAngle);
    currentAngle1 = animate_1(currentAngle1);
    currentAngle2 = animate_2(currentAngle2);
    currentAngle_zero = animate_3(currentAngle_zero);
    distanceX = moveInX(distanceX);
    distanceX_1 = speedUp(positionX, distanceX, distanceX_1);
    distanceY_1 = aimAt(positionX, positionY, distanceX, distanceX_1);
    console.log("positionX=", positionX);
    console.log("positionY=", positionY);
    if (windowSize == 1) {
      gl.clearColor(0.72, 0.5, 0.21, 1.0);
    }
    var n = initVertexBuffer(gl);
    // if (n < 0) {
    //   console.log('Failed to set the vertex information');
    //   return;
    // }
    draw(gl, n, currentAngle, currentAngle1,
         currentAngle2, currentAngle_zero, distanceX,
        distanceX_1, distanceY_1, modelMatrix, u_ModelMatrix);   // Draw shapes
    requestAnimationFrame(tick, canvas);
    									// Request that the browser re-draw the webpage
  };
  tick();							// start (and continue) animation: draw current image

}
function makeColorShapes() {
  colorShapes = new Float32Array([

    //炮
    //up
    6.0, 0.5, 0.5, 1.0,    0.641,0.641,0.07,    //0
    6.0, 0.5, -0.5, 1.0,   0.176,0.176,0.176,    //1
    0.0, 0.5, -0.5, 1.0,    0.641,0.641,0.07,   //2

    6.0, 0.5, 0.5, 1.0,    0.641,0.641,0.07,    //0
    0.0, 0.5, 0.5, 1.0,    0.101,0.468,0.07,    //3
    0.0, 0.5, -0.5, 1.0,   0.641,0.641,0.07,    //2

    //right
    6.0, 0.5, -0.5, 1.0,    0.176,0.176,0.176,      //1
    6.0, 0.5, 0.5, 1.0,     0.641,0.641,0.07,       //0
    6.0, -0.5, 0.5, 1.0,    0.101,0.468,0.07,      //4

    6.0, 0.5, -0.5, 1.0,      0.176,0.176,0.176,    //1
    6.0, -0.5, -0.5, 1.0,     0.641,0.641,0.07,     //5
    6.0, -0.5, 0.5, 1.0,      0.101,0.468,0.07,      //4

    //back
    0.0, 0.5, 0.5, 1.0,     0.101,0.468,0.07,    //3
    6.0, 0.5, 0.5, 1.0,     0.641,0.641,0.07,     //0
    6.0, -0.5, 0.5, 1.0,    0.101,0.468,0.07,    //4

    0.0, 0.5, 0.5, 1.0,    0.101,0.468,0.07,    //3
    0.0, -0.5, 0.5, 1.0,   0.176,0.176,0.176,     //6
    6.0, -0.5, 0.5, 1.0,   0.101,0.468,0.07,     //4

    //left
    0.0, 0.5, 0.5, 1.0,      0.101,0.468,0.07,    //3
    0.0, 0.5, -0.5, 1.0,     0.641,0.641,0.07,    //2
   0.0, -0.5, -0.5, 1.0,     0.101,0.468,0.07,   //7

     0.0, 0.5, 0.5, 1.0,      0.101,0.468,0.07,   //3
     0.0, -0.5, 0.5, 1.0,    0.176,0.176,0.176,     //6
    0.0, -0.5, -0.5, 1.0,     0.101,0.468,0.07,    //7

//front
    6.0, 0.5, -0.5, 1.0,     0.176,0.176,0.176,      //1
    0.0, 0.5, -0.5, 1.0,      0.641,0.641,0.07,      //2
   0.0, -0.5, -0.5, 1.0,      0.101,0.468,0.07,      //7

    6.0, 0.5, -0.5, 1.0,      0.176,0.176,0.176,       //1
    6.0, -0.5, -0.5, 1.0,     0.641,0.641,0.07,        //5
    0.0, -0.5, -0.5, 1.0,     0.101,0.468,0.07,       //7

//bottom
    0.0, -0.5, -0.5, 1.0,     0.101,0.468,0.07,        //7
    0.0, -0.5, 0.5, 1.0,     0.176,0.176,0.176,        //6
    6.0, -0.5, 0.5, 1.0,      0.101,0.468,0.07,        //4

    0.0, -0.5, -0.5, 1.0,      0.101,0.468,0.07,        //7
    6.0, -0.5, -0.5, 1.0,      0.641,0.641,0.07,       //5
    6.0, -0.5, 0.5, 1.0,       0.101,0.468,0.07,        //4

      //下半身
      //up
      1.0, 0.5, 1.0, 1.0,     0.641,0.641,0.07,    //0
    //  1.0, 0.5, -1.0, 1.0,   0.176,0.176,0.176,    //1
      1.0, 0.5, -1.0, 1.0,    color_var ,(color_var+0.3) % 0.5,(color_var+0.5) % 0.5,    //1
     -1.0, 0.5, -1.0, 1.0,    0.641,0.641,0.07,   //2

      1.0, 0.5, 1.0, 1.0,     0.641,0.641,0.07,    //0
      -1.0, 0.5, 1.0, 1.0,    0.101,0.468,0.07,    //3
     -1.0, 0.5, -1.0, 1.0,    0.641,0.641,0.07,    //2

      //right
      //  1.0, 0.5, -1.0, 1.0,   0.176,0.176,0.176,    //1
        1.0, 0.5, -1.0, 1.0,    color_var ,(color_var+0.3) % 0.5,(color_var+0.5) % 0.5,    //1
      1.0, 0.5, 1.0, 1.0,     0.641,0.641,0.07,       //0
      0.7, -0.5, 1.0, 1.0,    0.101,0.468,0.07,      //4

      //  1.0, 0.5, -1.0, 1.0,   0.176,0.176,0.176,    //1
        1.0, 0.5, -1.0, 1.0,    color_var ,(color_var+0.3) % 0.5,(color_var+0.5) % 0.5,    //1
      0.7, -0.5, -1.0, 1.0,     0.641,0.641,0.07,     //5
      0.7, -0.5, 1.0, 1.0,      0.101,0.468,0.07,     //4

      //back
     -1.0, 0.5, 1.0, 1.0,     0.101,0.468,0.07,    //3
      1.0, 0.5, 1.0, 1.0,     0.641,0.641,0.07,     //0
      0.7, -0.5, 1.0, 1.0,    0.101,0.468,0.07,    //4

     -1.0, 0.5, 1.0, 1.0,     0.101,0.468,0.07,    //3
     -0.7, -0.5, 1.0, 1.0,    0.176,0.176,0.176,     //6
      0.7, -0.5, 1.0, 1.0,    0.101,0.468,0.07,    //4

      //left
      -1.0, 0.5, 1.0, 1.0,     0.101,0.468,0.07,    //3
      -1.0, 0.5, -1.0, 1.0,    0.641,0.641,0.07,    //2
      -0.7, -0.5, -1.0, 1.0,   0.101,0.468,0.07,   //7

      -1.0, 0.5, 1.0, 1.0,      0.101,0.468,0.07,   //3
      -0.7, -0.5, 1.0, 1.0,     0.176,0.176,0.176,     //6
     -0.7, -0.5, -1.0, 1.0,     0.101,0.468,0.07,    //7

  //front
  //  1.0, 0.5, -1.0, 1.0,   0.176,0.176,0.176,    //1
    1.0, 0.5, -1.0, 1.0,    color_var ,(color_var+0.3) % 0.5,(color_var+0.5) % 0.5,    //1
     -1.0, 0.5, -1.0, 1.0,      0.641,0.641,0.07,     //2
     -0.7, -0.5, -1.0, 1.0,     0.101,0.468,0.07,      //7

     //  1.0, 0.5, -1.0, 1.0,   0.176,0.176,0.176,    //1
       1.0, 0.5, -1.0, 1.0,    color_var ,(color_var+0.3) % 0.5,(color_var+0.5) % 0.5,    //1
      0.7, -0.5, -1.0, 1.0,     0.641,0.641,0.07,       //5
     -0.7, -0.5, -1.0, 1.0,     0.101,0.468,0.07,        //7

  //bottom
     -0.7, -0.5, -1.0, 1.0,     0.101,0.468,0.07,        //7
      -0.7, -0.5, 1.0, 1.0,     0.176,0.176,0.176,        //6
      0.7, -0.5, 1.0, 1.0,      0.101,0.468,0.07,        //4

    -0.7, -0.5, -1.0, 1.0,       0.101,0.468,0.07,       //7
      0.7, -0.5, -1.0, 1.0,      0.641,0.641,0.07,       //5
      0.7, -0.5, 1.0, 1.0,       0.101,0.468,0.07,       //4

       //上半身
       //up
       0.5, 0.5, 0.5, 1.0,    0.641,0.641,0.07,    //0
       0.5, 0.5, -0.5, 1.0,   0.176,0.176,0.176,    //1
      -0.5, 0.5, -0.5, 1.0,   0.641,0.641,0.07,   //2

       0.5, 0.5, 0.5, 1.0,     0.641,0.641,0.07,    //0
       -0.5, 0.5, 0.5, 1.0,    0.101,0.468,0.07,    //3
      -0.5, 0.5, -0.5, 1.0,    0.641,0.641,0.07,    //2

       //right
       0.5, 0.5, -0.5, 1.0,   0.176,0.176,0.176,      //1
       0.5, 0.5, 0.5, 1.0,     0.641,0.641,0.07,       //0
       1.0, -0.5, 1.0, 1.0,    0.101,0.468,0.07,      //4

       0.5, 0.5, -0.5, 1.0,      0.176,0.176,0.176,    //1
       1.0, -0.5, -1.0, 1.0,     0.641,0.641,0.07,     //5
       1.0, -0.5, 1.0, 1.0,     0.101,0.468,0.07,     //4

       //back
      -0.5, 0.5, 0.5, 1.0,     0.101,0.468,0.07,    //3
       0.5, 0.5, 0.5, 1.0,     0.641,0.641,0.07,    //0
       1.0, -0.5, 1.0, 1.0,    0.101,0.468,0.07,    //4

      -0.5, 0.5, 0.5, 1.0,    0.101,0.468,0.07,    //3
      -1.0, -0.5, 1.0, 1.0,   0.176,0.176,0.176,     //6
       1.0, -0.5, 1.0, 1.0,   0.101,0.468,0.07,     //4

       //left
       -0.5, 0.5, 0.5, 1.0,    0.101,0.468,0.07,    //3
       -0.5, 0.5, -0.5, 1.0,   0.641,0.641,0.07,    //2
      -1.0, -0.5, -1.0, 1.0,   0.101,0.468,0.07,   //7

       -0.5, 0.5, 0.5, 1.0,      0.101,0.468,0.07,   //3
       -1.0, -0.5, 1.0, 1.0,    0.176,0.176,0.176,    //6
      -1.0, -0.5, -1.0, 1.0,    0.101,0.468,0.07,    //7

   //front
       0.5, 0.5, -0.5, 1.0,      0.176,0.176,0.176,      //1
      -0.5, 0.5, -0.5, 1.0,      0.641,0.641,0.07,      //2
     -1.0, -0.5, -1.0, 1.0,     0.101,0.468,0.07,      //7

       0.5, 0.5, -0.5, 1.0,      0.176,0.176,0.176,       //1
       1.0, -0.5, -1.0, 1.0,     0.641,0.641,0.07,        //5
      -1.0, -0.5, -1.0, 1.0,     0.101,0.468,0.07,        //7

   //bottom
      -1.0, -0.5, -1.0, 1.0,    0.101,0.468,0.07,        //7
       -1.0, -0.5, 1.0, 1.0,     0.176,0.176,0.176,        //6
       1.0, -0.5, 1.0, 1.0,      0.101,0.468,0.07,        //4

      -1.0, -0.5, -1.0, 1.0,    0.101,0.468,0.07,        //7
       1.0, -0.5, -1.0, 1.0,      0.641,0.641,0.07,       //5
       1.0, -0.5, 1.0, 1.0,      0.101,0.468,0.07,        //4

//108:


     //wing 1
     0.25, 0.0,  0.0, 1.0,	  1.0, 0.0, 0.0,
    -0.25, 0.0,  0.0, 1.0,	  0.0, 0.0, 0.0,
     0.0,  0.0,  1.0, 1.0,	  0.0, 1.0, 0.0,
     //wing 2
      0.25, 0.0,  0.0, 1.0,	  1.0, 0.0, 0.0,
     -0.25, 0.0,  0.0, 1.0,	  0.0, 0.0, 0.0,
     -0.25, 0.0, -1.0, 1.0,	  1.0, 0.0, 0.0,
     //month
      0.0,   0.0,  0.0, 1.0,	  0.64, 0.36, 0.136,
     -0.5,   0.0,  0.0, 1.0,	  0.64, 0.36, 0.136,
     -0.25, -1.0,  0.0, 1.0,	  0.64, 0.36, 0.136,
  ]);
}

function makeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z),
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
											// (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts	= 27;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([1.0, 0.0, 1.0]);	// North Pole: light gray
  var equColr = new Float32Array([0.0, 1.0, 1.0]);	// Equator:    bright green
  var botColr = new Float32Array([1.0, 1.0, 0.0]);	// South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.

	// Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them.
										// each slice requires 2*sliceVerts vertices except 1st and
										// last ones, which require only 2*sliceVerts-1.

	// Create dome-shaped top slice of sphere at z=+1
	// s counts slices; v counts vertices;
	// j counts array elements (vertices * elements per vertex)
	var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
	var sin0 = 0.0;
	var cos1 = 0.0;
	var sin1 = 0.0;
	var j = 0;							// initialize our array index
	var isLast = 0;
	var isFirst = 1;
	for(s=0; s<slices; s++) {	// for each slice of the sphere,
		// find sines & cosines for top and bottom of this slice
		if(s==0) {
			isFirst = 1;	// skip 1st vertex of 1st slice.
			cos0 = 1.0; 	// initialize: start at north pole.
			sin0 = 0.0;
		}
		else {					// otherwise, new top edge == old bottom edge
			isFirst = 0;
			cos0 = cos1;
			sin0 = sin1;
		}								// & compute sine,cosine for new bottom edge.
		cos1 = Math.cos((s+1)*sliceAngle);
		sin1 = Math.sin((s+1)*sliceAngle);
		// go around the entire slice, generating TRIANGLE_STRIP verts
		// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
		if(s==slices-1) isLast=1;	// skip last vertex of last slice.
		for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {
			if(v%2==0)
			{				// put even# vertices at the the slice's top edge
							// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
							// and thus we can simplify cos(2*PI(v/2*sliceVerts))
				sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);
				sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);
				sphVerts[j+2] = cos0;
				sphVerts[j+3] = 1.0;
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = cos1;																				// z
				sphVerts[j+3] = 1.0;																				// w.
			}
			if(s==0) {	// finally, set some interesting colors for vertices:
				sphVerts[j+4]=topColr[0];
				sphVerts[j+5]=topColr[1];
				sphVerts[j+6]=topColr[2];
				}
			else if(s==slices-1) {
				sphVerts[j+4]=botColr[0];
				sphVerts[j+5]=botColr[1];
				sphVerts[j+6]=botColr[2];
			}
			else {
					sphVerts[j+4]=188/256;// equColr[0];
					sphVerts[j+5]=168/256;// equColr[1];
					sphVerts[j+6]=6/256;// equColr[2];
			}
		}
  }
}

function makeTorus() {

var rbend = 1.0;										// Radius of circle formed by torus' bent bar
var rbar = 0.5;											// radius of the bar we bent to form torus
var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
																		// more segments for more-circular torus
var barSides = 13;										// # of sides of the bar (and thus the
																		// number of vertices in its cross-section)
																		// >=3 req'd;
																		// more sides for more-circular cross-section
// for nice-looking torus with approx square facets,
//			--choose odd or prime#  for barSides, and
//			--choose pdd or prime# for barSlices of approx. barSides *(rbend/rbar)
// EXAMPLE: rbend = 1, rbar = 0.5, barSlices =23, barSides = 11.

	// Create a (global) array to hold this torus's vertices:
 torVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));
//	Each slice requires 2*barSides vertices, but 1st slice will skip its first
// triangle and last slice will skip its last triangle. To 'close' the torus,
// repeat the first 2 vertices at the end of the triangle-strip.  Assume 7

var phi=0, theta=0;										// begin torus at angles 0,0
var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
																			// (WHY HALF? 2 vertices per step in phi)
	// s counts slices of the bar; v counts vertices within one slice; j counts
	// array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
	for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
		for(v=0; v< 2*barSides; v++, j+=7) {		// for each vertex in this slice:
			if(v%2==0)	{	// even #'d vertices at bottom of slice,
				torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
																						 Math.cos((s)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
																						 Math.sin((s)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta)
				torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			else {				// odd #'d vertices at top of slice (s+1);
										// at same phi used at bottom of slice (v-1)
				torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
																						 Math.cos((s+1)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
																						 Math.sin((s+1)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta)
				torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			torVerts[j+4] = 0.4;		// random color 0.0 <= R < 1.0
			torVerts[j+5] = 0.1;		// random color 0.0 <= G < 1.0
			torVerts[j+6] = 0.1;		// random color 0.0 <= B < 1.0
      //
      // torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
      // torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
      // torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0

      // torVerts[j+4] =color_var;		// random color 0.0 <= R < 1.0
      // torVerts[j+5] = color_var;		// random color 0.0 <= G < 1.0
      // torVerts[j+6] = color_var;		// random color 0.0 <= B < 1.0
		}
	}
	// Repeat the 1st 2 vertices of the triangle strip to complete the torus:
			torVerts[j  ] = rbend + rbar;	// copy vertex zero;
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
			torVerts[j+1] = 0.0;
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==0)
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
			j+=7; // go to next vertex:
			torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
			torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep)
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 10.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
}



function initVertexBuffer(gl) {

  makeColorShapes();
  makeSphere();
  colorChage(color_var);
  makeTorus();

  var mySiz = colorShapes.length + sphVerts.length +torVerts.length;
  // 12 tetrahedron vertices; 36 cube verts (6 per side*6 sides)
  var nn = mySiz/floatsPerVertex;


  // Create a buffer object
  var vArray = new Float32Array(mySiz);
  colorShapes_start = 0;
  for (i=0,j=0;j<colorShapes.length;i++,j++){
    vArray[i] = colorShapes[j];
  }

  sphere_start = i;
  for(j=0;j<sphVerts.length;i++,j++){
    vArray[i] = sphVerts[j];
  }

  torStart = i;						// next, we'll store the torus;
  for(j=0; j< torVerts.length; i++, j++) {
    vArray[i] = torVerts[j];
  }

  var shapeBufferHandle = gl.createBuffer();
  if (!shapeBufferHandle) {
  //  console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, vArray, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

  //Get graphics system's handle for our Vertex Shader's position-input variable:
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
  //  console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
  //  console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w

  gl.enableVertexAttribArray(a_Color);
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
  }

// var distanceX = 0;
function draw(gl, n, currentAngle, currentAngle1,
               currentAngle2, currentAngle_zero, distanceX,
              distanceX_1, distanceY_1, modelMatrix, u_ModelMatrix) {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // 下半身
  modelMatrix.setTranslate(distanceX + 0.0, -0.6, 0.0);
  pushMatrix(modelMatrix);
  modelMatrix.scale(1, 1, 1);
  modelMatrix.scale(0.3, 0.3, 0.3);
 // modelMatrix.rotate(0, 1, 0, 0);
  modelMatrix.rotate(30, -1, 1, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 36,36);

  //上半身
  modelMatrix = popMatrix();
  modelMatrix.setTranslate(distanceX, -0.35, 0.0);
  pushMatrix(modelMatrix);
  modelMatrix.scale(1, 1, 1);
  modelMatrix.scale(0.2, 0.2, 0.22);
//  modelMatrix.rotate(currentAngle, 0, -1, 0);
//  modelMatrix.rotate(90, 0, 1, 0);
  modelMatrix.rotate(30, -1, 1, 0);
  modelMatrix.rotate(currentAngle*2, 0, 1, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 72,36);

  //炮
modelMatrix = popMatrix();
modelMatrix.translate(0, 0, 0);
pushMatrix(modelMatrix);
//modelMatrix.scale(1, 1, 1);
modelMatrix.scale(0.1, 0.1, 0.1);
//modelMatrix.rotate(90, 1, 0, 0);
modelMatrix.rotate(30, -1, 1, 0);
modelMatrix.rotate(currentAngle*2, 0, 1, 0);
//modelMatrix.translate(-0.0, 0.0, 0.0);
//modelMatrix.rotate(currentAngle/6 + 10, 0, 0, 1);
modelMatrix.rotate(currentAngle1, 0, 0, 1);
modelMatrix.translate(distanceX, 0, 0);
// X = getElementViewLeft(modelMatrix.elements);
//
// Y =  getElementViewTop(modelMatrix.elements);
gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
gl.drawArrays(gl.TRIANGLES, 0,36);

//---------------------Draw the cannonball---------------------
if (distanceX_1 < 20  && tank_switch
  && distanceX_1 != birdPosition_x + xMdragTot
&&distanceY_1 != birdPosition_y + yMdragTot) {
modelMatrix = popMatrix();
modelMatrix.translate(0.25,0.05, 0);
//modelMatrix.setTranslate( 0.4, 0.4, 0.0);
// modelMatrix = popMatrix();
// modelMatrix.translate(distanceX, 0, 0);
modelMatrix.scale(0.06, 0.06, -0.06);
pushMatrix(modelMatrix);
//modelMatrix.rotate(90, 1, 0, 0);
//modelMatrix.translate(0, 0 ,0);

modelMatrix.translate(distanceX_1, distanceY_1, 0);
gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
                sphere_start/floatsPerVertex,	// start at this vertex number, and
                sphVerts.length/floatsPerVertex);
}

//------------------------Draw a bird---------------------------------
if (bird_on) {
  //body
  var birdPosition_x = 0.4;
  var birdPosition_y = 0.5;
   modelMatrix.setTranslate(birdPosition_x + xMdragTot, birdPosition_y + yMdragTot, 0.0);
   pushMatrix(modelMatrix); // 'set' means DISCARD old matrix,
   modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys                                         // to match WebGL display canvas.
   modelMatrix.scale(0.04, 0.04, 0.02);
   modelMatrix.translate(-3.0,0.0,0.0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
   gl.drawArrays(gl.TRIANGLES, 0,36);
  popMatrix(modelMatrix);

  // neck
  modelMatrix.setTranslate(-0.215 + birdPosition_x + xMdragTot, birdPosition_y + yMdragTot, 0.0);
  modelMatrix.rotate(30,0,0,-1);
  modelMatrix.rotate(-45 - 0.5 * currentAngle1, 0, 0, 1);
  modelMatrix.scale(0.03, 0.02, 0.02);
  modelMatrix.translate(-5.5,5.0, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0,36);

  // Draw bird_mouth
   modelMatrix.translate(0.0, 0.5, 0.0);
   modelMatrix.scale(0.5, 1.0, 0.5);
   modelMatrix.scale(4.0, 5.0, 1);
   modelMatrix.rotate(currentAngle1, 0, 0, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 114,3);

  //tail
  modelMatrix.setTranslate(0.2 + birdPosition_x + xMdragTot, 0.0 + birdPosition_y + yMdragTot, 0.0);
  modelMatrix.rotate(-90,1,0,0);
  modelMatrix.scale(0.1, 0.2, 0.1);
  modelMatrix.translate(-0.8,0.0,0.0);
  modelMatrix.rotate(currentAngle1*0.6+30, 0, 1, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 108,3);
  // wing
  modelMatrix.setTranslate(birdPosition_x + xMdragTot, birdPosition_y + yMdragTot, 0.0);  // 'set' means DISCARD old matrix,
  modelMatrix.scale(0.25,0.5,-0.5);							// convert to left-handed coord sys
   modelMatrix.rotate(currentAngle1, 1, 0, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 108,3);
  popMatrix(modelMatrix);

  // another wing
  modelMatrix.setTranslate(birdPosition_x + xMdragTot, birdPosition_y + yMdragTot, 0.0);  // 'set' means DISCARD old matrix,
  modelMatrix.scale(0.25,0.5,-0.5);							// convert to left-handed coord sys
  modelMatrix.rotate(-currentAngle1, 1, 0, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 111,3);



}

//draw a UFO
//===============draw torus==============================
modelMatrix.setTranslate(-0.4, 0.4, 0.0);	// 'set' means DISCARD old matrix,
            // (drawing axes centered in CVV), and then make new
            // drawing axes moved to the lower-left corner of CVV.
modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
                                        // to match WebGL display canvas.
modelMatrix.scale(0.1, 0.04, 0.1);
            // Make it smaller:
//modelMatrix.rotate(currentAngle, 0, 1, 1);  // Spin on YZ axis
modelMatrix.rotate(0, 0, 1, 0);
modelMatrix.rotate(90, 1, 0, 0);
modelMatrix.rotate(currentAngle_zero*10, 0, 0, 1);

//===============draw sphere==========
modelMatrix.scale(1, 1, 2);
//modelMatrix.rotate(currentAngle_zero*5, 0, 0, 1);
var dist = Math.sqrt(xMdragTot*xMdragTot + yMdragTot*yMdragTot);
modelMatrix.rotate(dist*120.0, -yMdragTot+0.0001, xMdragTot+0.0001, 0.0);
gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
                sphere_start/floatsPerVertex,	// start at this vertex number, and
                sphVerts.length/floatsPerVertex);

// Drawing:
// Pass our current matrix to the vertex shaders:
gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // Draw just the torus's vertices
gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
              torStart/floatsPerVertex,	// start at this vertex number, and
              torVerts.length/floatsPerVertex);	// draw this many vertices.
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;

  if(angle >  90.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if(angle < -90.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;

  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

var g_last1 = Date.now();
function animate_1(angle) {
  var elapsed1 = 10;

  if(angle >  25.0 && ANGLE_STEP1 > 0) ANGLE_STEP1 = -ANGLE_STEP1;
  if(angle <  -5.0 && ANGLE_STEP1 < 0) ANGLE_STEP1 = -ANGLE_STEP1;

  var newAngle = angle + (ANGLE_STEP1 * elapsed1) / 1000.0;
  return newAngle %= 360;
}

var t_last = Date.now();

function animate_2(angle) {
  if(angle >   45.0 && ANGLE_STEP2 > 0) ANGLE_STEP2 = ANGLE_STEP2;
  if(angle <  -45.0 && ANGLE_STEP2 < 0) ANGLE_STEP2 = ANGLE_STEP2;

  var newAngle = angle + (ANGLE_STEP2 * 10) / 1000.0;
  return newAngle %= 360;
}

function animate_3(angle) {
  var newAngle = angle + (ANGLE_STEP1 * 10) / 1000.0;
  return newAngle %= 360;
}

function moveInX(distanceX) {
//==============================================================================
  // Calculate the elapsed time
  distanceX += MOVE_STEP;
  if (distanceX > 1.4) {
    distanceX = -1.4;
  }
  return distanceX;
}

function speedUp(positionX, distanceX, distanceX_1) {
  if (MOVE_STEP != 0) {
    SPEED_STEP = MOVE_STEP * 40;
  }else {
    SPEED_STEP = 0.4;
  }
  if (isDrag) {
    distanceX_1 = distanceX_1 + SPEED_STEP * (positionX - distanceX) / Math.abs(positionX - distanceX);
    return distanceX_1;
  }else {
    return distanceX_1;
  }
}

function aimAt(positionX, positionY, distanceX, distanceX_1) {
  var position_Y = positionY / (positionX - distanceX) * (distanceX_1 - distanceX);
  return position_Y;
}

function colorChage(color_var) {
  color_var += 0.1;
  if (color_var > 1) {
    color_var = 0;
  }
}
//==================HTML Button Callbacks

function TankrunStop() {
//  MOVE_STEP = 0.005;
  if (MOVE_STEP * MOVE_STEP > 0) {
  //  myTmp = MOVE_STEP;
    MOVE_STEP = 0.0;
  }else {
    MOVE_STEP = 0.005;
  }
}

function BirdrunStop() {
  if (ANGLE_STEP1 * ANGLE_STEP1 > 0) {
    myTmp1 = ANGLE_STEP1;
    ANGLE_STEP1 = 0.0;
  }else {
    ANGLE_STEP1 = myTmp1;
  }
}

function TankSwitch() {
  if (tank_switch && tank_switch) {
    tank_switch = false;
  }else {
    tank_switch = true;
  }
//  tank_switch = true;
}


function BirdSwitch() {
  if (bird_on && bird_on) {
    bird_on = false;
  }else {
    bird_on = true;
  }
}

//===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev, gl, canvas) {

  var rect = ev.target.getBoundingClientRect();
  var xp = ev.clientX - rect.left;
  var yp = canvas.height - (ev.clientY - rect.top);
  var x = (xp - canvas.width/2)  /
         (canvas.width/2);

  positionX = x;
  // console.log("positionX=", positionX);

 var y = (yp - canvas.height/2) /
        (canvas.height/2);

  positionY = y;
  // console.log("positionY=", positionY);

 isDrag = true;

 distanceX_1 = distanceX;
 distanceY_1 = 0;

 xMclik = x;
 yMclik = y;
}
function myMouseMove(ev, gl, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);

	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	xMclik = x;													// Make next drag-measurement from here.
	yMclik = y;
  // console.log("hello world!");
  // console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);

	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);

	isDrag = false;
//  distanceX_1 = 0;

	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
//	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
};


function myKeyDown(ev) {
  switch(ev.keyCode) {
    case 37 : MOVE_STEP = -0.005;
              //alert("hello worl!!!");
              break;
    case 39 : MOVE_STEP = 0.005;
              break;
    case 72 : alert("User Instruction:\n"+
    "1. The bird are composed of several parts, including 2D and 3D objects, like that robot arm.\n"+
  "2. Only when the button BirdOn is clicked can the bird be dragged by mouse.\n"+
"3. The tank are composed of three 3D parts, and upper part and cannon can spin seperately.\n"+
"4. The tank can move horizontally, which can be controlled by two methods: keyboard and the button TankrunStop.\n"+
"5. The tank can launch cannon balls continously, which can happen when the mouse is clicked.\n"+
"6. The cannon balls which are shooted have their own direction, which is determined by the click position.\n"+
"7. The color of canvas can change when the window size varies.\n"+
"8. whether the bird is still or not can be controlled by the button BirdrunStop.\n");
             break;
  }
}

function myKeyUp(ev) {
MOVE_STEP = 0.00;
}

function myKeyPress(ev) {

}

//=========================================================================

window.addEventListener("resize",function(ev){
    windowSize = 1;
  }, true);

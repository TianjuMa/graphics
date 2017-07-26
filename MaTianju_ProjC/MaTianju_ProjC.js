var floatsPerVertex = 7;

var canvas = false;
var gl = false;

var u_ModelMatrix = false;
var u_ViewMatrix = false;
var u_ProjMatrix = false;
var u_NormalMatrix = false;

var uLoc_Ke = false;
var uLoc_Ka = false;
var uLoc_Kd = false;
var uLoc_Kd2 = false;			// for K_d within the MatlSet[0] element.l
var uLoc_Ks = false;
var uLoc_Kshiny = false;

var u_eyePosWorld = false;

var modelMatrix = new Matrix4();
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var normalMatrix = new Matrix4();

var eyePosWorld = new Float32Array(3); // x,y,z in world coords

var mat = new Material();
var headlamp = new LightsT();
var movelamp = new LightsT();

var shadingMode = false;
var lightingMode = false;

var currentAngle1 = 0.0;
var currentAngle = 0.0;
var ANGLE_STEP = 45.0;
var ANGLE_STEP2 = 45.0;

var g_EyeX = 0;
var g_EyeY = 4.0;
var g_EyeZ = -21;

var g_LookAtX = 0;
var g_LookAtY = 4.0;
var g_LookAtZ = -20;

var g_UpX = 0;
var g_UpY = 1;
var g_UpZ = 0;

var light_move_X = 0.0;
var light_move_Y = 3.0;
var light_move_Z = 0.0;

var camera1 = -1;
var camera2 = 0;
var LOOK_STEP = 0.05;

var isOn_headLamp = true;
var isOn_moveLamp = true;

function main() {
    //==============================================================================
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Set the vertex coordinates and color (the blue triangle is in the front)
    n = initVertexBuffers(gl);

    if (n < 0) {
        console.log('Failed to specify the vertex information');
        return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1.0);

    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.DEPTH_TEST);

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

    if (!u_ModelMatrix || !u_ViewMatrix || !u_ProjMatrix) {
        console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
        return;
    }
    if (!u_NormalMatrix) {
        console.log('Failed to Get the storage locations of u_NormalMatrix');
        return;
    }

    u_eyePosWorld = gl.getUniformLocation(gl.program, 'u_eyePosWorld');
    if (!u_eyePosWorld) {
        console.log('Failed to Get the storage locations of u_eyePosWorld');
        return;
    }

    shadingMode = gl.getUniformLocation(gl.program, 'shadingMode');
    lightingMode = gl.getUniformLocation(gl.program, 'lightingMode');
    if ( !shadingMode || !lightingMode) {
        console.log('Failed to Get the storage locations of SLmode');
        return;
    }

    movelamp.u_pos  = gl.getUniformLocation(gl.program, 'lamp_move.u_LampPos');
    movelamp.u_ambi = gl.getUniformLocation(gl.program, 'lamp_move.u_LampAmbi');
    movelamp.u_diff = gl.getUniformLocation(gl.program, 'lamp_move.u_LampDiff');
    movelamp.u_spec = gl.getUniformLocation(gl.program, 'lamp_move.u_LampSpec');

    if( !movelamp.u_pos || !movelamp.u_ambi	|| !movelamp.u_diff || !movelamp.u_spec	) {
      console.log('Failed to get GPUs movelamp storage locations');
      return;
    }

    headlamp.u_pos  = gl.getUniformLocation(gl.program, 'lamp_head.u_LampPos');
    headlamp.u_ambi = gl.getUniformLocation(gl.program, 'lamp_head.u_LampAmbi');
    headlamp.u_diff = gl.getUniformLocation(gl.program, 'lamp_head.u_LampDiff');
    headlamp.u_spec = gl.getUniformLocation(gl.program, 'lamp_head.u_LampSpec');
    if( !headlamp.u_pos || !headlamp.u_ambi	|| !headlamp.u_diff || !headlamp.u_spec	) {
      console.log('Failed to get GPUs Headlamp storage locations');
      return;
    }

    mat.initMaterial(gl, 'mat.u_Ke', 'mat.u_Ka', 'mat.u_Kd', 'mat.u_Ks', 'mat.u_Kshiny');

    window.addEventListener("keydown", function(ev){
      var ex = g_EyeX;
      var ey = g_EyeY;
      var ez = g_EyeZ;
      var ax = g_LookAtX;
      var ay = g_LookAtY;
      var az = g_LookAtZ;
      var length = Math.sqrt((az - ez) * (az - ez) + (ay - ey) * (ay - ey) + (ax - ex) * (ax - ex));
      switch (ev.keyCode) {
          case 87:                                      //w
              g_LookAtZ += 0.2 * (az - ez) / length;
              g_EyeZ += 0.2 * (az - ez) / length;
              break;
          case 83:                                      //s
              g_LookAtZ -= 0.2 * (az - ez) / length;
              g_EyeZ -= 0.2 * (az - ez) / length;
              break;
          case 65:                                      //a
              g_LookAtX += 0.2 * (az - ez) / length;
              g_EyeX += 0.2 * (az - ez) / length;
              break;
          case 68:                        //d
              g_LookAtX -= 0.2 * (az - ez) / length;
              g_EyeX -= 0.2 * (az - ez) / length;
              break;
          case 81:                                      //q
              g_LookAtY += 0.2 * length;
              g_EyeY += 0.2 * length;
              break;
          case 69:                                      //e
              g_LookAtY -= 0.2 * length;
              g_EyeY -= 0.2 * length;
              break;

          case 73:                                    //i
              light_move_Z += 0.2;
              break;
          case 75:                                    //k
              light_move_Z -= 0.2;
              break;
          case 74:                                     //j
              light_move_X += 0.2;
              break;
          case 76:                                      //l
              light_move_X -= 0.2;
              break;
          case 85:                                      //u
              light_move_Y += 0.2;
              break;
          case 79:                                      //o
              light_move_Y -= 0.2;
              break;

          case 37:                                      //left
              if (camera1 == -1) {
                camera2 = -Math.acos((ex - ax) / length) + LOOK_STEP;
              } else {
                camera2 += LOOK_STEP;
              }
              g_LookAtX = ex + length * Math.cos (camera2);
              g_LookAtZ = - ez - length * Math.sin (camera2) ;
              camera1 = 1;
              break;
          case 39:                                     //right
              if (camera1 == -1) {
                camera2 = -Math.acos((ex - ax) / length) + LOOK_STEP;
              } else {
                camera2 -= LOOK_STEP;
              }
              g_LookAtX = ex + length * Math.cos(camera2);
              g_LookAtZ = -ez - length *  Math.sin(camera2);
              camera = 1;
              break;
          default:
              break;
      }
    }, false);

    var tick = function() {
        animate(); // Update the rotation angle
        headLampControl();
        moveLampControl();
        winResize();
        draw();
        requestAnimationFrame(tick, canvas);
    };
    tick();
}

function makeTorus() {
    var rbend = 1.0; // Radius of circle formed by torus' bent bar
    var rbar = 0.5; // radius of the bar we bent to form torus
    var barSlices = 40; // # of bar-segments in the torus: >=3 req'd;																	// more segments for more-circular torus
    var barSides = 40; // # of sides o
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
        for (v = 0; v < 2 * barSides; v++, j += 7) { // for each vertex in this slice:
            if (v % 2 === 0) { // even #'d vertices at bottom of slice,
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
            torVerts[j + 4] = Math.cos((v) * phiHalfStep) * Math.cos((s) * thetaStep); // random color 0.0 <= R < 1.0
            torVerts[j + 5] = Math.cos((v) * phiHalfStep) * Math.cos((s) * thetaStep); // random color 0.0 <= G < 1.0
            torVerts[j + 6] = Math.sin((v) * phiHalfStep); // random color 0.0 <= B < 1.0
        }
    }
}

function makeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z),
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 100;    // # of slices of the sphere along the z axis. >=3 req'd
                      // (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts  = 100; // # of vertices around the top edge of the slice
                      // (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.7, 0.7, 0.7]);  // North Pole: light gray
  var equColr = new Float32Array([0.3, 0.7, 0.3]);  // Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);  // South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;  // lattitude angle spanned by one slice.

  // Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
                    // # of vertices * # of elements needed to store them.
                    // each slice requires 2*sliceVerts vertices except 1st and
                    // last ones, which require only 2*sliceVerts-1.

  // Create dome-shaped top slice of sphere at z=+1
  // s counts slices; v counts vertices;
  // j counts array elements (vertices * elements per vertex)
  var cos0 = 0.0;         // sines,cosines of slice's top, bottom edge.
  var sin0 = 0.0;
  var cos1 = 0.0;
  var sin1 = 0.0;
  var j = 0;              // initialize our array index
  var isLast = 0;
  var isFirst = 1;
  for(s=0; s<slices; s++) { // for each slice of the sphere,
    if(s === 0) {
      isFirst = 1;  // skip 1st vertex of 1st slice.
      cos0 = 1.0;   // initialize: start at north pole.
      sin0 = 0.0;
    }
    else {          // otherwise, new top edge == old bottom edge
      isFirst = 0;
      cos0 = cos1;
      sin0 = sin1;
    }               // & compute sine,cosine for new bottom edge.
    cos1 = Math.cos((s+1)*sliceAngle);
    sin1 = Math.sin((s+1)*sliceAngle);

    if(s==slices-1) isLast=1;
    for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {
      if(v%2==0)
      {
        sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);
        sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);
        sphVerts[j+2] = cos0;
        sphVerts[j+3] = 1.0;
      }
      else {
        sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);  // x
        sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);  // y
        sphVerts[j+2] = cos1;
        sphVerts[j+3] = 1.0;
      }

        sphVerts[j+4]=sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);
        sphVerts[j+5]=sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);
        sphVerts[j+6]=cos1;
    }
  }
}

function makeTetrahedron(){
  var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);
	// for surface normals:
	var sq23 = Math.sqrt(2.0/3.0);
	var sq29 = Math.sqrt(2.0/9.0);
	var sq89 = Math.sqrt(8.0/9.0);
	var thrd = 1.0/3.0;

  tetVerts = new Float32Array([
  // Vertex coordinates(x,y,z,w) and color (R,G,B) for a new color tetrahedron:
    /// Face 0: (right side).  Unit Normal Vector: N0 = (sq23, sq29, thrd)
     // Node 0 (apex, +z axis; 			color--blue, 				surf normal (all verts):
          0.0,	 0.0, sq2, 1.0,				 sq23,	sq29, thrd,
     // Node 1 (base: lower rt; red)
     			c30, -0.5, 0.0, 1.0, 			 		sq23,	sq29, thrd,
     // Node 2 (base: +y axis;  grn)
     			0.0,  1.0, 0.0, 1.0,  				sq23,	sq29, thrd,


     // Face 1: (left side).		Unit Normal Vector: N1 = (-sq23, sq29, thrd)
		 // Node 0 (apex, +z axis;  blue)
		 			0.0,	 0.0, sq2, 1.0,			   -sq23,	sq29, thrd,
     // Node 2 (base: +y axis;  grn)
     			0.0,  1.0, 0.0, 1.0,  		  -sq23,	sq29, thrd,
     // Node 3 (base:lower lft; white)
    			-c30, -0.5, 0.0, 1.0, 			 -sq23,	sq29,	thrd,


    // Face 2: (lower side) 	Unit Normal Vector: N2 = (0.0, -sq89, thrd)
		 // Node 0 (apex, +z axis;  blue)
		 			0.0,	 0.0, sq2, 1.0,					0.0, -sq89,	thrd,
    // Node 3 (base:lower lft; white)
    			-c30, -0.5, 0.0, 1.0, 				0.0, -sq89,	thrd,          																							//0.0, 0.0, 0.0, // Normals debug
     // Node 1 (base: lower rt; red)
     			c30, -0.5, 0.0, 1.0, 			 		0.0, -sq89,	thrd,


// Face 3: (base side)  Unit Normal Vector: N2 = (0.0, 0.0, -1.0)
    // Node 3 (base:lower lft; white)
    			-c30, -0.5, 0.0, 1.0, 				0.0, 	0.0, -1.0,
    // Node 2 (base: +y axis;  grn)
     			0.0,  1.0, 0.0, 1.0,  			  0.0, 	0.0, -1.0,
    // Node 1 (base: lower rt; red)
     			c30, -0.5, 0.0, 1.0, 					0.0, 	0.0, -1.0,
  ]);
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
        if (v % 2 === 0) { // put even-numbered vertices at (xnow, -xymax, 0)
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
    makeTorus();
    makeSphere();
    makeTetrahedron();
    makeGroundGrid();
    makeMyShape();

    mySiz = sphVerts.length + tetVerts.length + torVerts.length + gndVerts.length + myShape.length;
    var nn = mySiz / floatsPerVertex;
    var verticesColorsNormals = new Float32Array(mySiz);

    i = 0;

    sphStart = 0; // next, we'll store the sphere;
    for (i = 0, j = 0; j < sphVerts.length; i++, j++) { // don't initialize i -- reuse it!
        verticesColorsNormals[i] = sphVerts[j];
    }
    tetStart = i;
    for(j=0; j< tetVerts.length; i++, j++) {// don't initialize i -- reuse it!
      verticesColorsNormals[i] = tetVerts[j];
    }
    torStart = i; // next, we'll store the torus;
    for (j = 0; j < torVerts.length; i++, j++) {
        verticesColorsNormals[i] = torVerts[j];
    }
    myShapeStart = i; // next we'll store the ground-plane;
    for (j = 0; j < myShape.length; i++, j++) {
        verticesColorsNormals[i] = myShape[j];
    }
    gndStart = i; // next we'll store the ground-plane;
    for (j = 0; j < gndVerts.length; i++, j++) {
        verticesColorsNormals[i] = gndVerts[j];
    }

    // Create a vertex buffer object (VBO)
    var vertexColorbuffer = gl.createBuffer();
    if (!vertexColorbuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Write vertex information to buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColorsNormals, gl.STATIC_DRAW);

    var FSIZE = verticesColorsNormals.BYTES_PER_ELEMENT;
    // Assign the buffer object to a_Position and enable the assignment
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    // Use handle to specify how to retrieve **POSITION** data from our VBO:
    gl.vertexAttribPointer(
        a_Position, // choose Vertex Shader attribute to fill with data
        4, // how many values? 1,2,3 or 4.  (we're using x,y,z,w)
        gl.FLOAT, // data type for each value: usually gl.FLOAT
        false, // did we supply fixed-point data AND it needs normalizing?
        FSIZE * floatsPerVertex, // Stride -- how many bytes used to store each vertex?
        // (x,y,z,w, r,g,b) * bytes/value
        0); // Offset -- now many bytes from START of buffer to the
    // value we will actually use?
    gl.enableVertexAttribArray(a_Position);
    // Enable assignment of vertex buffer object's position data

    // Surface Normal = vertex position;
    var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return -1;
    }

    gl.vertexAttribPointer(
        a_Normal,
        3,
        gl.FLOAT,
        false,
        FSIZE * floatsPerVertex,
        FSIZE * 4);

    gl.enableVertexAttribArray(a_Normal);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return mySiz / floatsPerVertex; // return # of vertices
}

function headLampControl() {
    headColorChange();
}

function moveLampControl() {
    changeSLMode();
    MoveColorChange();
}

function headColorChange() {
    computeColor();
    if (isOn_headLamp === true) {
      headlamp.I_ambi.elements.set([ambiR, ambiG, ambiB]);
      headlamp.I_diff.elements.set([diffR, diffG, diffB]);
      headlamp.I_spec.elements.set([specR, specG, specB]);
    }
}

function MoveColorChange() {
    computeColor();
    if (isOn_moveLamp === true) {
      movelamp.I_ambi.elements.set([ambiR, ambiG, ambiB]);
      movelamp.I_diff.elements.set([diffR, diffG, diffB]);
      movelamp.I_spec.elements.set([specR, specG, specB]);
    }

}

function changeSLMode() {
    var a = document.getElementById("shadingMode");
    var shade = a.options[a.selectedIndex].value;
    // gl.uniform1i(shadingMode, shade);
    gl.uniform1i(shadingMode, shade, 1);

    var b = document.getElementById("lightingMode");
    var light = b.options[b.selectedIndex].value;
    // gl.uniform1i(lightingMode, light);
    gl.uniform1i(lightingMode, light, 1);
}

function headLampSwitch() {
    if (isOn_headLamp === false) {
        isOn_headLamp = true;
        headlamp.I_ambi.elements.set([0.6, 0.6, 0.6]);
  		  headlamp.I_diff.elements.set([0.8, 0.8, 0.8]);
  		  headlamp.I_spec.elements.set([1.0, 1.0, 1.0]);
        document.getElementById("headLampSwitch").innerHTML = "Off";
    } else {
        isOn_headLamp = false;
        headlamp.I_ambi.elements.set([0.0, 0.0, 0.0]);
  			headlamp.I_diff.elements.set([0.0, 0.0, 0.0]);
  			headlamp.I_spec.elements.set([0.0, 0.0, 0.0]);
        document.getElementById("headLampSwitch").innerHTML = "On";
    }
}

function moveLampSwitch() {
    if (isOn_moveLamp === true) {
        isOn_moveLamp = false;
        movelamp.I_ambi.elements.set([0.0, 0.0, 0.0]);
  		  movelamp.I_diff.elements.set([0.0, 0.0, 0.0]);
  		  movelamp.I_spec.elements.set([0.0, 0.0, 0.0]);
        document.getElementById("moveLampSwitch").innerHTML = "On";
    } else {
        isOn_moveLamp = true;
        movelamp.I_ambi.elements.set([0.6, 0.6, 0.6]);
  		  movelamp.I_diff.elements.set([0.8, 0.8, 0.8]);
  		  movelamp.I_spec.elements.set([1.0, 1.0, 1.0]);
        document.getElementById("moveLampSwitch").innerHTML = "Off";
    }
}

function draw() {

  gl.uniform3fv(movelamp.u_pos,  movelamp.I_pos.elements.slice(0,3));
  gl.uniform3fv(movelamp.u_ambi, movelamp.I_ambi.elements);		// ambient
  gl.uniform3fv(movelamp.u_diff, movelamp.I_diff.elements);		// diffuse
  gl.uniform3fv(movelamp.u_spec, movelamp.I_spec.elements);		// Specular

	gl.uniform3fv(headlamp.u_pos,  headlamp.I_pos.elements.slice(0,3));
  gl.uniform3fv(headlamp.u_ambi, headlamp.I_ambi.elements);		// ambient
  gl.uniform3fv(headlamp.u_diff, headlamp.I_diff.elements);		// diffuse
  gl.uniform3fv(headlamp.u_spec, headlamp.I_spec.elements);		// Specular

    // Clear <canvas> color AND DEPTH buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // draw perspective
    gl.viewport(0, // Viewport lower-left corner
        0, // (x,y) location(in pixels)
        canvas.width, // viewport width, height.
        canvas.height);

    projMatrix.setPerspective(40, canvas.width / canvas.height, 1, 100);

    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    eyePosWorld.set([g_EyeX, g_EyeY, g_EyeZ]);
    gl.uniform3fv(u_eyePosWorld, eyePosWorld);

    // console.log('eyeX=', g_EyeX, 'eyeY=', g_EyeY, 'eyeZ=', g_EyeZ);
    // console.log('aX=', g_LookAtX, 'aY=', g_LookAtY, 'aZ=', g_LookAtZ);

    headlamp.I_pos.elements.set([g_EyeX, g_EyeY, g_EyeZ]); // eye pos

    viewMatrix.setLookAt(
        g_EyeX, g_EyeY, g_EyeZ, // eye position
        g_LookAtX, g_LookAtY, g_LookAtZ, // look-at point (origin)
        g_UpX, g_UpY, g_UpZ); // up vector (+y)

    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    drawMyScene();
}

function drawMyScene() {
    drawGrid();
    drawTank();
    drawTree();
    drawUFO();
    drawMoveLight();
}

function drawGrid() {
  modelMatrix.setIdentity();
  modelMatrix.setRotate(-90.0, 1, 0, 0);
  modelMatrix.translate(0.0, 0.0, -0.6);
  modelMatrix.scale(0.4, 0.4, 0.4);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  mat.setMaterialByIndex(3);
  gl.drawArrays(gl.TRIANGLE_STRIP, gndStart / 7, gndVerts.length / 7);
}

function drawTank() {
  // lower part
  modelMatrix.setIdentity();
  modelMatrix.scale(0.8,0.3,0.8);
  modelMatrix.translate(3.0, 0.0, 0.0);
  pushMatrix(modelMatrix);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  mat.setMaterialByIndex(2);
  gl.drawArrays(gl.TRIANGLES, myShapeStart / floatsPerVertex, 36);

  //upper part
  popMatrix(modelMatrix);
  modelMatrix.scale(0.5,0.8,0.6);
  modelMatrix.translate(0.0, 4.8, 0.0);
  modelMatrix.rotate(currentAngle, 0,1,0);
  pushMatrix(modelMatrix);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  mat.setMaterialByIndex(7);
  gl.drawArrays(gl.TRIANGLES, myShapeStart / floatsPerVertex, 36);

  //cannon
  popMatrix(modelMatrix);
  modelMatrix.scale(1.5,0.3,0.3);
  modelMatrix.translate(-3.3, 2.0, 0.0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  mat.setMaterialByIndex(7);
  gl.drawArrays(gl.TRIANGLES, myShapeStart / floatsPerVertex, 36);
}

function drawTree() {
   //lower
    modelMatrix.setIdentity();
    modelMatrix.scale(1.0, 0.6, 1.0);
    modelMatrix.rotate(20, 1,0,0);
    modelMatrix.translate(-3.0, 0.8, -0.8);
    modelMatrix.rotate(currentAngle1 * 3 - 45, 0,1,1);
    pushMatrix(modelMatrix);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    mat.setMaterialByIndex(2);

     gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                  tetStart/floatsPerVertex, // start at this vertex number, and
                  tetVerts.length/floatsPerVertex);

    //middle
    popMatrix(modelMatrix);
    // modelMatrix.rotate(180,0,0,1);
    modelMatrix.translate(0.0, 1.4, -0.5);
    modelMatrix.rotate(currentAngle1 * 3 - 45, 0,1,1);
    pushMatrix(modelMatrix);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    mat.setMaterialByIndex(2);

     gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                  tetStart/floatsPerVertex, // start at this vertex number, and
                  tetVerts.length/floatsPerVertex);

    //top
    popMatrix(modelMatrix);
    // modelMatrix.rotate(180,0,0,1);
    modelMatrix.translate(0.0, 1.4, -0.5);
    modelMatrix.rotate(currentAngle1 * 3 - 45, 0,1,1);
    // pushMatrix(modelMatrix);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    mat.setMaterialByIndex(2);

     gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                  tetStart/floatsPerVertex, // start at this vertex number, and
                  tetVerts.length/floatsPerVertex);

    //thrunk
    modelMatrix.setIdentity();
    modelMatrix.translate(-3.0, 0.0, 0.0);
    modelMatrix.scale(0.05, 0.2, 0.05);
    // modelMatrix.rotate(currentAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    mat.setMaterialByIndex(1);
    gl.drawArrays(gl.TRIANGLES, myShapeStart / floatsPerVertex, 36);

}

function drawUFO() {
  //sphere
  modelMatrix.setIdentity();
  modelMatrix.translate(10.0, 3.5, 4.0);
  modelMatrix.rotate(currentAngle * 3, 0, 1, 0);
  pushMatrix(modelMatrix);
  // modelMatrix.scale(0.05, 0.2, 0.05);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  mat.setMaterialByIndex(15);
  gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
          sphStart / floatsPerVertex, // start at this vertex number, and
          sphVerts.length / floatsPerVertex); // draw this many vertices.

  //torus
  popMatrix(modelMatrix);
  modelMatrix.rotate(90, 1, 0, 0);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  mat.setMaterialByIndex(11);
  gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
      torStart / floatsPerVertex, // start at this vertex number, and
      torVerts.length / floatsPerVertex);
}

function drawMoveLight() {
  //sphere
  modelMatrix.setIdentity();
  modelMatrix.translate(light_move_X, light_move_Y + 3.0, light_move_Z + 0.25);
  modelMatrix.scale(0.3, 0.3, 0.3);
  // modelMatrix.rotate(90,1,0,0);
  // modelMatrix.rotate(currentAngle * 2, 0, 0, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  mat.setMaterialByIndex(15);
  gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
                sphStart / floatsPerVertex, // start at this vertex number, and
                sphVerts.length / floatsPerVertex); // draw this many vertices.

  //tet
    modelMatrix.setIdentity();
    modelMatrix.translate(light_move_X, light_move_Y + 2.0, light_move_Z);
    modelMatrix.scale(0.8, 0.8, 0.8);
    modelMatrix.rotate(20, 1, 0 ,0);
    // modelMatrix.rotate(currentAngle * 2, 0.0, 1, 0);

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // Draw just the sphere's vertices

    movelamp.I_pos.elements.set([light_move_X, light_move_Y + 1, light_move_Z]);

    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    // modelMatrix.rotate(currentAngle * 2, 1, 1, 1);
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    mat.setMaterialByIndex(22);
    gl.drawArrays(gl.TRIANGLE_STRIP,        // use this drawing primitive, and
                  tetStart/floatsPerVertex, // start at this vertex number, and
                  tetVerts.length/floatsPerVertex);
}

function makeMyShape() {
    myShape = new Float32Array([
      // Create a cube
//    v6----- v5
//   /|      /|
//  v1------v0|
//  | |     | |
//  | |v7---|-|v4
//  |/      |/
//  v2------v3
// Coordinates
      2.0, 2.0, 2.0,1.0,    0.0, 0.0, 1.0,
      -2.0, 2.0, 2.0,1.0,   0.0, 0.0, 1.0,
      -2.0,-2.0, 2.0,1.0,   0.0, 0.0, 1.0,// v0-v1-v2-v3 front

      2.0, 2.0, 2.0,1.0,    0.0, 0.0, 1.0,
      -2.0,-2.0, 2.0,1.0,   0.0, 0.0, 1.0,
      2.0,-2.0, 2.0,1.0,    0.0, 0.0, 1.0,


      2.0, 2.0, 2.0,1.0,    1.0, 0.0, 0.0,
      2.0,-2.0, 2.0,1.0,    1.0, 0.0, 0.0,
      2.0,-2.0,-2.0,1.0,    1.0, 0.0, 0.0,// v0-v3-v4-v5 right

      2.0, 2.0, 2.0,1.0,    1.0, 0.0, 0.0,
      2.0,-2.0,-2.0,1.0,    1.0, 0.0, 0.0,
      2.0, 2.0,-2.0,1.0,    1.0, 0.0, 0.0,


      2.0, 2.0, 2.0,1.0,    0.0, 1.0, 0.0,
      2.0, 2.0,-2.0,1.0,    0.0, 1.0, 0.0,
      -2.0, 2.0,-2.0,1.0,   0.0, 1.0, 0.0,// v0-v5-v6-v1 up

      2.0, 2.0, 2.0, 1.0,   0.0, 1.0, 0.0,
      -2.0, 2.0,-2.0,1.0,   0.0, 1.0, 0.0,
      -2.0, 2.0, 2.0,1.0,   0.0, 1.0, 0.0,


      -2.0, 2.0, 2.0,1.0,   -1.0, 0.0, 0.0,
      -2.0, 2.0,-2.0,1.0,   -1.0, 0.0, 0.0,
      -2.0,-2.0,-2.0,1.0,   -1.0, 0.0, 0.0,// v1-v6-v7-v2 left

      -2.0, 2.0, 2.0,1.0,   -1.0, 0.0, 0.0,
      -2.0,-2.0,-2.0,1.0,   -1.0, 0.0, 0.0,
      -2.0,-2.0, 2.0,1.0,   -1.0, 0.0, 0.0,


      -2.0,-2.0,-2.0,1.0,   0.0,-1.0, 0.0,
      2.0,-2.0,-2.0,1.0,    0.0,-1.0, 0.0,
      2.0,-2.0, 2.0,1.0,    0.0,-1.0, 0.0,// v7-v4-v3-v2 down

      -2.0,-2.0,-2.0,1.0,   0.0,-1.0, 0.0,
      2.0,-2.0, 2.0, 1.0,   0.0,-1.0, 0.0,
      -2.0,-2.0, 2.0,1.0,   0.0,-1.0, 0.0,


      2.0,-2.0,-2.0,1.0,    0.0, 0.0,-1.0,
      -2.0,-2.0,-2.0,1.0,   0.0, 0.0,-1.0,
      -2.0, 2.0,-2.0,1.0,   0.0, 0.0,-1.0, // v4-v7-v6-v5 back

      2.0,-2.0,-2.0, 1.0,   0.0, 0.0,-1.0,
      -2.0, 2.0,-2.0,1.0,   0.0, 0.0,-1.0,
      2.0, 2.0,-2.0, 1.0,   0.0, 0.0,-1.0,
    ]);
}

var ambiR = 0.5;
var ambiG = 0.5;
var ambiB = 0.5;

var diffR = 0.5;
var diffG = 0.5;
var diffB = 0.5;

var specR = 0.5;
var specG = 0.5;
var specB = 0.5;

function computeColor() {
  ambiR = document.getElementById("ambient-r").value;
  ambiG = document.getElementById("ambient-g").value;
  ambiB = document.getElementById("ambient-b").value;

  diffR = document.getElementById("diffuse-r").value;
  diffG = document.getElementById("diffuse-g").value;
  diffB = document.getElementById("diffuse-b").value;

  specR = document.getElementById("specular-r").value;
  specG = document.getElementById("specular-g").value;
  specB = document.getElementById("specular-b").value;
}

function winResize() {
    canvas = document.getElementById('webgl'); // get current canvas
    gl = getWebGLContext(canvas); // and context:
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    draw();
}

var g_last = Date.now();

function animate() {
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;

    currentAngle = currentAngle + (ANGLE_STEP * elapsed) / 1000.0;
    currentAngle %= 360;

    if (currentAngle1 > 30.0 && ANGLE_STEP2 > 0) ANGLE_STEP2 = -ANGLE_STEP2;
    if (currentAngle1 < 0.0 && ANGLE_STEP2 < 0) ANGLE_STEP2 = -ANGLE_STEP2;

    currentAngle1 = currentAngle1 + (ANGLE_STEP2 * elapsed) / 5000.0;
    currentAngle1 %= 360;
}

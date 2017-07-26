var VSHADER_SOURCE =
    'precision mediump float;\n' +
    'precision highp int;\n' +

    'struct Lamp {\n' +
    '   vec3 u_LampPos;\n' +
    '   vec3 u_LampAmbi;\n' +
    '   vec3 u_LampDiff;\n' +
    '   vec3 u_LampSpec;\n' +
    '};\n' +

    'struct Material {\n' +
    '   vec4 u_Ke;\n' +
    '   vec4 u_Ka;\n' +
    '   vec4 u_Kd;\n' +
    '   vec4 u_Ks;\n' +
    '   int u_Kshiny;\n' +
    '};\n' +

    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Normal;\n' +

    'uniform Lamp lamp_head;\n' + //head light
    'uniform Lamp lamp_move;\n' + // moveable light
    'uniform Material mat;\n' +
    'uniform int shadingMode;\n' +
    'uniform int lightingMode;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'uniform mat4 u_ViewMatrix;\n' +
    'uniform mat4 u_ProjMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' + // Transformation matrix of the normal

    'varying vec4 v_Color;\n' +
    'varying vec4 v_Kd; \n' +
    'varying vec4 v_Position; \n' +
    'varying vec3 v_Normal; \n' +

    'void main() {\n' +
    '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
    '  if(shadingMode==1){\n' +
    '    vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    '    vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
    '    vec3 lightDirection = normalize(lamp_move.u_LampPos - vec3(vertexPosition));\n' +
    '    float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    '    vec3 diffuse = lamp_move.u_LampDiff * mat.u_Kd.xyz * nDotL ;\n' +
    '    vec3 ambient = lamp_move.u_LampAmbi * mat.u_Ka.xyz ;\n' +
    '    v_Color = vec4(ambient + diffuse, 1.0);\n' +
    '  }\n' +
    '  v_Position = u_ModelMatrix * a_Position; \n' +
    '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    '  v_Kd = mat.u_Kd; \n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'precision highp int;\n' +

    'struct Lamp {\n' +
    '   vec3 u_LampPos;\n' +
    '   vec3 u_LampAmbi;\n' +
    '   vec3 u_LampDiff;\n' +
    '   vec3 u_LampSpec;\n' +
    '};\n' +

    'struct Material {\n' +
    '   vec4 u_Ke;\n' +
    '   vec4 u_Ka;\n' +
    '   vec4 u_Kd;\n' +
    '   vec4 u_Ks;\n' +
    '   int u_Kshiny;\n' +
    '};\n' +

    'uniform Lamp lamp_head;\n' + //head light
    'uniform Lamp lamp_move;\n' + // moveable light
    'uniform Material mat;\n' + //material
    'uniform int shadingMode;\n' +
    'uniform int lightingMode;\n' +
    'uniform vec3 u_eyePosWorld; \n' +

    'varying vec4 v_Color;\n' +
    'varying vec3 v_Normal;\n' +
    'varying vec4 v_Position;\n' +
    'varying vec4 v_Kd; \n' +

    'void main() { \n' +
    '  vec3 normal = normalize(v_Normal); \n' +
    '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
    '  vec3 pointLightDirection = lamp_head.u_LampPos - v_Position.xyz;\n' +
    '  vec3 lightDir_head = normalize(lamp_head.u_LampPos - v_Position.xyz);\n' +
    '  float lambertian_head = max(dot(lightDir_head,normal), 0.0);\n' +
    '  float specular_head = 0.0;\n' +
    '  vec4 emissive_head = mat.u_Ke;\n' +
    '  vec4 ambient_head = vec4(lamp_head.u_LampAmbi,1.0) * mat.u_Ka;\n' +
    '  vec4 diffuse_head = vec4(lamp_head.u_LampDiff,1.0) * v_Kd * lambertian_head;\n' +
    '  vec4 speculr_head = vec4(lamp_head.u_LampSpec,1.0) * mat.u_Ks * specular_head;\n' +
    '  vec4 fragColor_head = vec4(emissive_head + ambient_head + diffuse_head + speculr_head);\n' +
    '  vec4 fragColor_move;\n' +

    '  if(shadingMode==1){\n' +
    '    fragColor_move = v_Color;\n' +
    '  }\n' +

    '  if(shadingMode==2){\n' +
    '  vec3 pointLightDirection = lamp_move.u_LampPos - v_Position.xyz;\n' +
    '  vec3 R = reflect(normalize(pointLightDirection), v_Normal);\n' +
    '  float diffuseLambert = dot(normalize(pointLightDirection),v_Normal);\n' +
    '  float specular = pow( max(0.0,dot(R,normalize(-vec3(v_Position)))), float(mat.u_Kshiny)/4.0);\n' +
    '  vec4 emissive_move = mat.u_Ke;\n' +
    '  vec4 ambient_move = vec4(lamp_move.u_LampAmbi,1.0) * mat.u_Ka ;\n' +
    '  vec4 diffuse_move = vec4(lamp_move.u_LampDiff,1.0) * v_Kd * diffuseLambert;\n' +
    '  vec4 speculr_move = vec4(lamp_move.u_LampSpec,1.0) * mat.u_Ks * specular;\n' +
    '  fragColor_move = vec4(emissive_move + ambient_move + diffuse_move + speculr_move);\n' +
    '  }\n' +

    '  if(lightingMode==1){\n' +
    '     vec3 lightDirection_move = normalize(lamp_move.u_LampPos - v_Position.xyz);\n' +
    '     float nDotL_move = max(dot(lightDirection_move, normal), 0.0);\n' +
    '     vec3 lightColor = lamp_move.u_LampDiff * mat.u_Kd.xyz * nDotL_move + lamp_move.u_LampAmbi * mat.u_Ka.xyz;\n' +
    '     float specular = 0.0;\n' +
    '     vec3 finalValue =  lightColor * nDotL_move * (0.5 + specular * 0.5);\n' +
    '     fragColor_move = vec4(finalValue, 1.0)*3.0;\n' +
    '  }\n' +

    '  if(lightingMode==2){\n' +
    '     vec3 direction_move = normalize(lamp_move.u_LampPos - v_Position.xyz);\n' +
    '     float lite_move = max(dot(direction_move,normal), 0.0);\n' +
    '     float specular_move = 0.0;\n' +
    '     vec4 emissive_move = mat.u_Ke;\n' +
    '     vec4 ambient_move = vec4(lamp_move.u_LampAmbi,1.0) * mat.u_Ka;\n' +
    '     vec4 diffuse_move = vec4(lamp_move.u_LampDiff,1.0) * v_Kd * lite_move;\n' +
    '     vec4 speculr_move = vec4(lamp_move.u_LampSpec,1.0) * mat.u_Ks * specular_move;\n' +
    '     fragColor_move = vec4(emissive_move + ambient_move + diffuse_move + speculr_move);\n' +
    '  }\n' +
    '  gl_FragColor = fragColor_head + fragColor_move;\n' +
    '}\n';

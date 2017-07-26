var Material = function(){
    this.gl = false;
    this.K_emit = new Float32Array(4);
    this.K_ambi = new Float32Array(4);
    this.K_spec = new Float32Array(4);
    this.K_diff = new Float32Array(4);
    this.K_shiny = 0.0;


    this.u_Ke = false;
    this.u_Ka = false;
    this.u_Kd = false;
    this.u_Ks = false;
    this.u_Kshiny = false;
};

Material.prototype.initMaterial = function(GL,ke,ka,kd,ks,kshiny){
    this.gl = GL;
    if(!this.gl){
        console.log('Failed te get gl');
        return;
    }


    this.u_Ke = this.gl.getUniformLocation(this.gl.program, ke);
    this.u_Ka = this.gl.getUniformLocation(this.gl.program, ka);
    this.u_Kd = this.gl.getUniformLocation(this.gl.program, kd);
    this.u_Ks = this.gl.getUniformLocation(this.gl.program, ks);
    this.u_Kshiny = this.gl.getUniformLocation(this.gl.program, kshiny);

    if(!this.u_Ke || !this.u_Ka || !this.u_Kd || !this.u_Ks || !this.u_Kshiny){
        console.log('Failed to get the material property storage locations');
        return;
    }

    return this;

};

Material.prototype.setMaterialByIndex = function(materialType) {
    var MATL_RED_PLASTIC = 1;
    var MATL_GRN_PLASTIC = 2;
    var MATL_BLU_PLASTIC = 3;
    var MATL_BLACK_PLASTIC = 4;
    var MATL_BLACK_RUBBER = 5;
    var MATL_BRASS = 6;
    var MATL_BRONZE_DULL = 7;
    var MATL_BRONZE_SHINY = 8;
    var MATL_CHROME = 9;
    var MATL_COPPER_DULL = 10;
    var MATL_COPPER_SHINY = 11;
    var MATL_GOLD_DULL = 12;
    var MATL_GOLD_SHINY = 13;
    var MATL_PEWTER = 14;
    var MATL_SILVER_DULL = 15;
    var MATL_SILVER_SHINY = 16;
    var MATL_EMERALD = 17;
    var MATL_JADE = 18;
    var MATL_OBSIDIAN = 19;
    var MATL_PEARL = 20;
    var MATL_RUBY = 21;
    var MATL_TURQUOISE = 22;
    var DEFAULT = 23;                   // (used for unrecognized material names)

    switch(materialType)
    {
        case MATL_RED_PLASTIC: // 1
            this.K_emit.set([0.0,     0.0,    0.0,    1.0]);
            this.K_ambi.set([0.1,     0.1,    0.1,    1.0]);
            this.K_diff.set([0.6,     0.0,    0.0,    1.0]);
            this.K_spec.set([0.6,     0.6,    0.6,    1.0]);   
            this.K_shiny = 100.0;
            break;
        case MATL_GRN_PLASTIC: // 2
            this.K_emit.set([0.0,     0.0,    0.0,    1.0]);
            this.K_ambi.set([0.05,    0.05,   0.05,   1.0]);
            this.K_diff.set([0.0,     0.6,    0.0,    1.0]);
            this.K_spec.set([0.2,     0.2,    0.2,    1.0]);   
            this.K_shiny = 60.0;
            break;
        case MATL_BLU_PLASTIC: // 3
            this.K_emit.set([0.0,     0.0,    0.0,    1.0]);
            this.K_ambi.set([0.05,    0.05,   0.05,   1.0]);
            this.K_diff.set([0.0,     0.2,    0.6,    1.0]);
            this.K_spec.set([0.1,     0.2,    0.3,    1.0]);   
            this.K_shiny = 5.0;
            break;
        case MATL_BLACK_PLASTIC:
            this.K_emit.set([0.0,     0.0,    0.0,    1.0]);
            this.K_ambi.set([0.0,     0.0,    0.0,    1.0]);
            this.K_diff.set([0.01,    0.01,   0.01,   1.0]);
            this.K_spec.set([0.5,     0.5,    0.5,    1.0]);   
            this.K_shiny = 32.0;
            break;
        case MATL_BLACK_RUBBER:
            this.K_emit.set([0.0,     0.0,    0.0,    1.0]);
            this.K_ambi.set([0.02,    0.02,   0.02,   1.0]);
            this.K_diff.set([0.01,    0.01,   0.01,   1.0]);
            this.K_spec.set([0.4,     0.4,    0.4,    1.0]);   
            this.K_shiny = 10.0;
            break;
        case MATL_BRASS:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.329412, 0.223529, 0.027451, 1.0]);
            this.K_diff.set([0.780392, 0.568627, 0.113725, 1.0]);
            this.K_spec.set([0.992157, 0.941176, 0.807843, 1.0]);   
            this.K_shiny = 27.8974;
            break;
        case MATL_BRONZE_DULL:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.2125,   0.1275,   0.054,    1.0]);
            this.K_diff.set([0.714,    0.4284,   0.18144,  1.0]);
            this.K_spec.set([0.393548, 0.271906, 0.166721, 1.0]);  
            this.K_shiny = 25.6;
            break;
        case MATL_BRONZE_SHINY:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.25,     0.148,    0.06475,  1.0]);
            this.K_diff.set([0.4,      0.2368,   0.1036,   1.0]);
            this.K_spec.set([0.774597, 0.458561, 0.200621, 1.0]);  
            this.K_shiny = 76.8;
            break;
        case MATL_CHROME:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.25,     0.25,     0.25,     1.0]);
            this.K_diff.set([0.4,      0.4,      0.4,      1.0]);
            this.K_spec.set([0.774597, 0.774597, 0.774597, 1.0]);  
            this.K_shiny = 76.8;
            break;
        case MATL_COPPER_DULL:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.19125,  0.0735,   0.0225,   1.0]);
            this.K_diff.set([0.7038,   0.27048,  0.0828,   1.0]);
            this.K_spec.set([0.256777, 0.137622, 0.086014, 1.0]);  
            this.K_shiny = 12.8;
            break;
        case MATL_COPPER_SHINY:
            this.K_emit.set([0.0,      0.0,      0.0,       1.0]);
            this.K_ambi.set([0.2295,   0.08825,  0.0275,    1.0]);
            this.K_diff.set([0.5508,   0.2118,   0.066,     1.0]);
            this.K_spec.set([0.580594, 0.223257, 0.0695701, 1.0]);  
            this.K_shiny = 51.2;
            break;
        case MATL_GOLD_DULL:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.24725,  0.1995,   0.0745,   1.0]);
            this.K_diff.set([0.75164,  0.60648,  0.22648,  1.0]);
            this.K_spec.set([0.628281, 0.555802, 0.366065, 1.0]);  
            this.K_shiny = 51.2;
            break;
        case MATL_GOLD_SHINY:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.24725,  0.2245,   0.0645,   1.0]);
            this.K_diff.set([0.34615,  0.3143,   0.0903,   1.0]);
            this.K_spec.set([0.797357, 0.723991, 0.208006, 1.0]);  
            this.K_shiny = 83.2;
            break;
        case MATL_PEWTER:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.105882, 0.058824, 0.113725, 1.0]);
            this.K_diff.set([0.427451, 0.470588, 0.541176, 1.0]);
            this.K_spec.set([0.333333, 0.333333, 0.521569, 1.0]);  
            this.K_shiny = 9.84615;
            break;
        case MATL_SILVER_DULL:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.19225,  0.19225,  0.19225,  1.0]);
            this.K_diff.set([0.50754,  0.50754,  0.50754,  1.0]);
            this.K_spec.set([0.508273, 0.508273, 0.508273, 1.0]);  
            this.K_shiny = 51.2;
            break;
        case MATL_SILVER_SHINY:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.23125,  0.23125,  0.23125,  1.0]);
            this.K_diff.set([0.2775,   0.2775,   0.2775,   1.0]);
            this.K_spec.set([0.773911, 0.773911, 0.773911, 1.0]);  
            this.K_shiny = 89.6;
            break;
        case MATL_EMERALD:
            this.K_emit.set([0.0,     0.0,      0.0,     1.0]);
            this.K_ambi.set([0.0215,  0.1745,   0.0215,  0.55]);
            this.K_diff.set([0.07568, 0.61424,  0.07568, 0.55]);
            this.K_spec.set([0.633,   0.727811, 0.633,   0.55]);   
            this.K_shiny = 76.8;
            break;
        case MATL_JADE:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.135,    0.2225,   0.1575,   0.95]);
            this.K_diff.set([0.54,     0.89,     0.63,     0.95]);
            this.K_spec.set([0.316228, 0.316228, 0.316228, 0.95]);   
            this.K_shiny = 12.8;
            break;
        case MATL_OBSIDIAN:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.05375,  0.05,     0.06625,  0.82]);
            this.K_diff.set([0.18275,  0.17,     0.22525,  0.82]);
            this.K_spec.set([0.332741, 0.328634, 0.346435, 0.82]);   
            this.K_shiny = 38.4;
            break;
        case MATL_PEARL:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.25,     0.20725,  0.20725,  0.922]);
            this.K_diff.set([1.0,      0.829,    0.829,    0.922]);
            this.K_spec.set([0.296648, 0.296648, 0.296648, 0.922]);   
            this.K_shiny = 11.264;
            break;
        case MATL_RUBY:
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.1745,   0.01175,  0.01175,  0.55]);
            this.K_diff.set([0.61424,  0.04136,  0.04136,  0.55]);
            this.K_spec.set([0.727811, 0.626959, 0.626959, 0.55]);   
            this.K_shiny = 76.8;
            break;
        case MATL_TURQUOISE: // 22
            this.K_emit.set([0.0,      0.0,      0.0,      1.0]);
            this.K_ambi.set([0.1,      0.18725,  0.1745,   0.8]);
            this.K_diff.set([0.396,    0.74151,  0.69102,  0.8]);
            this.K_spec.set([0.297254, 0.30829,  0.306678, 0.8]);   
            this.K_shiny = 12.8;
            break;

        default:
            // ugly featureless (emissive-only) red:
            this.K_emit.set([0.5, 0.0, 0.0, 1.0]); // DEFAULT: ugly RED emissive light only
            this.K_ambi.set([0.0, 0.0, 0.0, 1.0]); // r,g,b,alpha  ambient reflectance
            this.K_diff.set([0.0, 0.0, 0.0, 1.0]); //              diffuse reflectance
            this.K_spec.set([0.0, 0.0, 0.0, 1.0]); //              specular reflectance
            this.K_shiny = 1.0;        // Default (don't set specular exponent to zero!)
            break;
    }
    
    if(!this.gl){
        console.log('Failed te get gl');
        return;
    }

    if(!this.u_Ke || !this.u_Ka || !this.u_Kd || !this.u_Ks || !this.u_Kshiny){
        console.log('Failed to get the material property storage locations');
        return;
    }

    this.gl.uniform4fv(this.u_Ke, this.K_emit);              // Ke emissive
    this.gl.uniform4fv(this.u_Ka, this.K_ambi);              // Ka ambient
    this.gl.uniform4fv(this.u_Kd, this.K_diff);                // Kd   diffuse
    this.gl.uniform4fv(this.u_Ks, this.K_spec);              // Ks specular
    this.gl.uniform1i(this.u_Kshiny, this.K_shiny);                          // Kshiny shinyness exponent
    return this;
};


Material.prototype.setMaterialByInput = function(emissive,ambient,diffuse,specular,shiny) {
    this.K_emit.set(emissive);
    this.K_ambi.set(ambient);
    this.K_diff.set(diffuse);
    this.K_spec.set(specular);
    this.K_shiny = shiny;
    
    if(!this.gl){
        console.log('Failed te get gl');
        return;
    }

    if(!this.u_Ke || !this.u_Ka || !this.u_Kd || !this.u_Ks || !this.u_Kshiny){
        console.log('Failed to get the material property storage locations');
        return;
    }

    this.gl.uniform4fv(this.u_Ke, this.K_emit);              // Ke emissive
    this.gl.uniform4fv(this.u_Ka, this.K_ambi);              // Ka ambient
    this.gl.uniform4fv(this.u_Kd, this.K_diff);                // Kd   diffuse
    this.gl.uniform4fv(this.u_Ks, this.K_spec);              // Ks specular
    this.gl.uniform1i(this.u_Kshiny, this.K_shiny);                          // Kshiny shinyness exponent
    return this;
};


Material.prototype.getMaterial = function(){
     return {emissive: this.K_emit, ambient: this.K_ambi, diffuse: this.K_diff, specular: this.K_spec, shiny: this.K_shiny};
};

Material.prototype.getKe = function(){
     return this.K_emit;
};

Material.prototype.getKa = function(){
     return this.K_ambi;
};

Material.prototype.getKd = function(){
     return this.K_diff;
};

Material.prototype.getKs = function(){
     return this.K_spec;
};

Material.prototype.getKshiny = function(){
     return this.K_shiny;
};
const vs = `#version 300 es

in vec3 a_position;

uniform mat4 u_worldViewProjection;
uniform vec3 u_dimensionScale;
uniform vec3 eye_position;

out vec3 ray_direction;
out vec3 eye_position2;
out vec3 dimensionScale;

void main(){

  vec3 translation = vec3(0.5,0.5,0.5)-u_dimensionScale*0.5;
  gl_Position = u_worldViewProjection* vec4(u_dimensionScale*(a_position) + translation, 1);
  eye_position2 = (eye_position - translation) / u_dimensionScale;
  ray_direction = a_position - eye_position2;
  
}
`;

const fs = `#version 300 es

precision highp float;

in vec3 ray_direction;
in vec3 eye_position2;

uniform highp sampler3D volumeMap;
uniform highp sampler2D colorMap;
uniform vec3 dimensionVolume;
uniform float thresholdIntensity;
uniform float miptype;


// i dont understand why uniform is throwing error
highp float tmin = 1.175494351e-38;  
highp float tmax = 3.402823466e+38;

out vec4 outColor;

vec2 boxIntersection(vec3 ray_direction2, float origin[3]){
  
  float boxmin[3] = float[3](0.0, 0.0, 0.0);
  float boxmax[3] = float[3](1.0, 1.0, 1.0);
  vec3 invdir = 1.0/ray_direction2;

  float inv_raydirection[3] = float[3](invdir.x, invdir.y, invdir.z);
  for(int i=0; i<3; i++ ){
    float t1 = (boxmin[i]-origin[i])*inv_raydirection[i];
    float t2 = (boxmax[i]-origin[i])*inv_raydirection[i];

    tmin = max(tmin, min(t1, t2));
    tmax = min(tmax, max(t1, t2));
  }

  if(tmax>max(tmin,0.0)){
    return vec2(tmin, tmax);
  }

  else{
    discard;
  }

}

void main(){

  vec3 ray_direction_normal = normalize(ray_direction);
  float origin[3] = float[3](eye_position2.x, eye_position2.y, eye_position2.z);
  
  vec2 two_endpoint = boxIntersection(ray_direction_normal, origin);

  vec3 size_of_voxel = 1.0/dimensionVolume;
  vec3 rayTraverseLength = size_of_voxel/abs(ray_direction_normal);

  float minTraversalLength = min(rayTraverseLength.x, min(rayTraverseLength.y, rayTraverseLength.z));

  vec3 voxelCord = eye_position2 + ray_direction_normal*two_endpoint.x;

  float maxSampleValue = 0.0;

  vec4 colormapData = vec4(0.0, 0.0, 0.0, 0.0);

  for(float t=two_endpoint.x; t<two_endpoint.y; t+=minTraversalLength){

    float volumedata = texture(volumeMap, voxelCord).r;
    
    // if(volumedata >= ((thresholdIntensity/100.0)-0.1) &&  volumedata <= ((thresholdIntensity/100.0)+0.1)){
      
    if(volumedata >= maxSampleValue && volumedata >= (thresholdIntensity/100.0)){
        maxSampleValue= volumedata;
        colormapData = vec4(texture(colorMap, vec2(volumedata, 0.5)).rgb, 1.0);
    }
      voxelCord += ray_direction_normal*minTraversalLength;
    }
    if(miptype == 1.0){
      outColor = vec4(maxSampleValue, maxSampleValue, maxSampleValue, 1.0);      
    }
    else{
      outColor = colormapData;
    }

}

`;

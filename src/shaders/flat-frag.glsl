#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

void main() {
  out_Col = vec4(0.5, 0.5 + fs_Pos.y, 0.4, 1.0);
}

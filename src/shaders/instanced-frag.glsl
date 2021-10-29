#version 300 es
precision highp float;

vec3 light = vec3(-5.0, 7.45, -5.0);

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_CameraPos;
in vec4 fs_LightVec;

out vec4 out_Col;

void main()
{
    float dist = 1.0 - (length(fs_Pos.xyz) * 2.0);

    float ambient = 0.2;
    float lambert = max(0.0, dot(fs_Nor.xyz, normalize(light))) + ambient;

    vec4 halfVec = (vec4(normalize(fs_LightVec.xyz), fs_LightVec.w) + vec4(normalize(fs_CameraPos.xyz), fs_CameraPos.w)) / 2.0; 
    float specular = pow(max(dot(halfVec, fs_Nor), 0.0), 32.0);
    float blinn = lambert + 0.75 * specular;

    out_Col = vec4(fs_Col.xyz * blinn, 1.0);
}

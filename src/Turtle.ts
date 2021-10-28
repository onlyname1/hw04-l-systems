import {vec3, mat4, glMatrix, vec4} from 'gl-matrix';

export default class Turtle 
{
  position: vec3;
  forward: vec3;
  up: vec3;
  right: vec3;
  scale: vec3;
  depth: number;
  worldUp: vec3;
  worldForward: vec3;

  constructor(pos: vec3, scale: vec3, depth: number) 
  {
    this.position = pos;
    this.forward = vec3.fromValues(0, 1, 0);
    this.up = vec3.fromValues(0, 0, 1);
    this.right = vec3.fromValues(1, 0, 0);
    this.scale = scale;
    this.depth = depth;
    this.worldUp = vec3.fromValues(0, 1, 0);
    this.worldForward = vec3.fromValues(0, 0, 1);
  }

  moveForward(move: number)
  {
    let temp = vec3.clone(this.forward);
    vec3.add(this.position, this.position, vec3.scale(temp, temp, move));
    return this.getTransform();
  }

  rotateX(deg: number)
  {
    vec3.rotateX(this.forward, this.forward, vec3.fromValues(0, 0, 0), glMatrix.toRadian(deg));
    vec3.normalize(this.forward, this.forward);
    this.recalculateDirections();
  }

  rotateY(deg: number)
  {
    vec3.rotateX(this.forward, this.forward, vec3.fromValues(0, 0, 0), glMatrix.toRadian(deg));
    vec3.normalize(this.forward, this.forward);
    this.recalculateDirections();
  }

  rotateZ(deg: number)
  {
    vec3.rotateX(this.forward, this.forward, vec3.fromValues(0, 0, 0), glMatrix.toRadian(deg));
    vec3.normalize(this.forward, this.forward);
    this.recalculateDirections();
  }

  recalculateDirections()
  {
    let temp = this.worldUp
    if (this.forward == this.worldUp)
    {
      temp = this.worldForward;
    }

    vec3.cross(this.right, this.forward, temp);
    vec3.normalize(this.right, this.right);
    vec3.cross(this.up, this.right, this.forward);
    vec3.normalize(this.up, this.up);
  }

  resize(scale: vec3)
  {
    vec3.multiply(this.scale, this.scale, scale);
  }

  getTransform()
  {
    let scale = mat4.fromScaling(mat4.create(), this.scale);
    let rotate = mat4.fromValues(this.right[0], this.right[1], this.right[2], 0, 
                                 this.up[0], this.up[1], this.up[2], 0,
                                 this.forward[0], this.forward[1], this.forward[2], 0,
                                 0, 0, 0, 1);
    let translate = mat4.fromTranslation(mat4.create(), this.position);
    let transformation = mat4.create();
    mat4.multiply(transformation, rotate, scale);
    return mat4.multiply(transformation, translate, transformation);
  }
}
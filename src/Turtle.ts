import {vec3, mat4, glMatrix, vec4} from 'gl-matrix';

export default class Turtle 
{
  position: vec3;
  oldPosition: vec3;
  forward: vec3;
  oldForward: vec3;
  up: vec3;
  oldUp: vec3;
  right: vec3;
  oldRight: vec3;
  scale: vec3;
  oldScale: vec3;
  color: vec3;
  oldColor: vec3;
  depth: number;
  worldUp: vec3;
  worldForward: vec3;

  constructor(pos: vec3, scale: vec3, color: vec3, depth: number) 
  {
    this.position = pos;
    this.oldPosition = vec3.clone(pos);
    this.forward = vec3.fromValues(0, 1, 0);
    this.oldForward = vec3.clone(this.forward);
    this.up = vec3.fromValues(0, 0, 1);
    this.oldUp = vec3.clone(this.up);
    this.right = vec3.fromValues(1, 0, 0);
    this.oldRight = vec3.clone(this.right);
    this.scale = scale;
    this.oldScale = vec3.clone(scale);
    this.oldScale = vec3.scale(this.oldScale, this.oldScale, 1.02);
    this.color = color;
    this.oldColor = vec3.clone(color);
    this.depth = depth;
    this.worldUp = vec3.fromValues(0, 1, 0);
    this.worldForward = vec3.fromValues(0, 0, 1);
  }

  moveForward(move: number)
  {
    this.oldPosition = vec3.clone(this.position);
    let temp = vec3.clone(this.forward);
    vec3.add(this.position, this.position, vec3.scale(temp, temp, move));
    return "moved";
  }

  rotateX(deg: number)
  {
    this.oldForward = vec3.clone(this.forward);
    vec3.rotateX(this.forward, this.forward, vec3.fromValues(0, 0, 0), glMatrix.toRadian(deg));
    vec3.normalize(this.forward, this.forward);
    this.recalculateDirections();
  }

  rotateY(deg: number)
  {
    this.oldForward = vec3.clone(this.forward);
    vec3.rotateY(this.forward, this.forward, vec3.fromValues(0, 0, 0), glMatrix.toRadian(deg));
    vec3.normalize(this.forward, this.forward);
    this.recalculateDirections();
  }

  rotateZ(deg: number)
  {
    this.oldForward = vec3.clone(this.forward);
    vec3.rotateZ(this.forward, this.forward, vec3.fromValues(0, 0, 0), glMatrix.toRadian(deg));
    vec3.normalize(this.forward, this.forward);
    this.recalculateDirections();
  }

  recalculateDirections()
  {
    this.oldRight = vec3.clone(this.right);
    this.oldUp = vec3.clone(this.up);
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

  resize(x: number, y: number, z: number)
  {
    this.oldScale = vec3.clone(this.scale);
    this.scale[0] *= x;
    this.scale[1] *= y;
    this.scale[2] *= z;
  }

  setColor(col: vec3)
  {
    this.oldColor = vec3.clone(this.color);
    this.color = vec3.clone(col);
  }

  getTransform(u: number)
  {
    let tempScale = vec3.create();
    let tempPos = vec3.create();
    let tempForward = vec3.create();
    let tempRight = vec3.create();
    let tempUp = vec3.create();
    vec3.lerp(tempScale, this.oldScale, this.scale, u);
    vec3.lerp(tempPos, this.oldPosition, this.position, u);
    // not the right way to interpolate directions, but it'll have to do
    vec3.lerp(tempForward, this.oldForward, this.forward, u);
    vec3.lerp(tempRight, this.oldRight, this.right, u);
    vec3.lerp(tempUp, this.oldUp, this.up, u);
    vec3.normalize(tempForward, tempForward);
    vec3.normalize(tempRight, tempRight);
    vec3.normalize(tempUp, tempUp);
    let scale = mat4.fromScaling(mat4.create(), tempScale);
    // let rotate = mat4.fromValues(tempRight[0], tempRight[1], tempRight[2], 0, 
    //                              tempUp[0], tempUp[1], tempUp[2], 0,
    //                              tempForward[0], tempForward[1], tempForward[2], 0,
    //                              0, 0, 0, 1);
    let rotate = mat4.fromValues(this.right[0], this.right[1], this.right[2], 0, 
                                 this.up[0], this.up[1], this.up[2], 0,
                                 this.forward[0], this.forward[1], this.forward[2], 0,
                                 0, 0, 0, 1);
    let translate = mat4.fromTranslation(mat4.create(), tempPos);
    let transformation = mat4.create();
    mat4.multiply(transformation, rotate, scale);
    return mat4.multiply(transformation, translate, transformation);
  }

  getColor(u: number)
  {
    let tempColor = vec3.create();
    return vec3.lerp(tempColor, this.oldColor, this.color, u);
  }

  // makes deep copy of turtle
  getCopy()
  { 
    let turtleCopy = new Turtle(vec3.fromValues(0, 0, 0), vec3.fromValues(1, 1, 1), vec3.fromValues(0, 0, 0), this.depth);
    turtleCopy.forward = vec3.clone(this.forward);
    turtleCopy.oldForward = vec3.clone(this.oldForward);
    turtleCopy.oldRight = vec3.clone(this.oldRight);
    turtleCopy.oldUp = vec3.clone(this.oldUp);
    turtleCopy.position = vec3.clone(this.position);
    turtleCopy.oldPosition = vec3.clone(this.oldPosition);
    turtleCopy.scale = vec3.clone(this.scale);
    turtleCopy.oldScale = vec3.clone(this.oldScale);
    turtleCopy.color = vec3.clone(this.color);
    turtleCopy.oldColor = vec3.clone(this.oldColor);
    turtleCopy.recalculateDirections();
    return turtleCopy;
  }
}
import {vec3} from 'gl-matrix';

export default class Turtle 
{
  position: vec3;
  orientation: vec3;
  scale: vec3;
  depth: number;

  constructor(pos: vec3, orient: vec3, scale: vec3, depth: number) 
  {
    this.position = pos;
    this.orientation = orient;
    this.scale = scale;
    this.depth = depth;
  }

  moveForward(move: vec3)
  {
    vec3.add(this.position, this.position, move);
  }

  rotate(orient: vec3)
  {
    vec3.add(this.orientation, this.orientation, orient);
  }

  resize(scale: vec3)
  {
    vec3.add(this.scale, this.scale, scale);
  }
}
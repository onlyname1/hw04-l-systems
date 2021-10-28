import {vec3, mat4} from 'gl-matrix';
const Stats = require('stats-js');
import * as fs from 'fs';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Turtle from './Turtle';
import DrawingRule from './DrawingRule';
import ExpansionRule from './ExpansionRule';
import Mesh from './geometry/Mesh';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  rotation: 27,
  jaggedness: 0.5,
  branchSize: 1.0,
  'Load Scene': loadScene,
};

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let expansionRules: Map<string, ExpansionRule> = new Map();
let drawRules: Map<string, DrawingRule> = new Map();
let turtleStack: Turtle[] = [];
let meshPath = './models/cylinder.obj';
let cylinder: Mesh;
let opt = { encoding: 'utf8' };

// function loadScene() {
//   square = new Square();
//   square.create();
//   screenQuad = new ScreenQuad();
//   screenQuad.create();

//   // Set up instanced rendering data arrays here.
//   // This example creates a set of positional
//   // offsets and gradiated colors for a 100x100 grid
//   // of squares, even though the VBO data for just
//   // one square is actually passed to the GPU
//   let offsetsArray = [];
//   let colorsArray = [];
//   let n: number = 100.0;
//   for(let i = 0; i < n; i++) {
//     for(let j = 0; j < n; j++) {
//       offsetsArray.push(i);
//       offsetsArray.push(j);
//       offsetsArray.push(0);

//       colorsArray.push(i / n);
//       colorsArray.push(j / n);
//       colorsArray.push(1.0);
//       colorsArray.push(1.0); // Alpha channel
//     }
//   }
//   let offsets: Float32Array = new Float32Array(offsetsArray);
//   let colors: Float32Array = new Float32Array(colorsArray);
//   square.setInstanceVBOs(offsets, colors);
//   square.setNumInstances(n * n); // grid of "particles"
// }

function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();
  let str : string;
  fs.readFile(meshPath, opt, function(err, data) {
    if (err) return console.error(err);
    str = data;
  });
  cylinder = new Mesh(str, vec3.fromValues(0, 0, 0));
  cylinder.create();

  let lsystem = 'FFA';

  // make expansion rules
  expansionRules.set('A', new ExpansionRule(1.0, "![&B]/[&B]/[&B]/[&B]/[&B]/[&B]", "A"));
  expansionRules.set('B', new ExpansionRule(controls.jaggedness, "-!/F[C]B", "B"));
  expansionRules.set('C', new ExpansionRule(controls.jaggedness, "!F^!F", "C"));

  // progress l system
  let lsteps: number = 8;
  for (let i = 0; i < lsteps; i++)
  {
    let newLSystem = '';
    for (let character of lsystem)
    {
      if (expansionRules.get(character))
      {
        newLSystem += expansionRules.get(character);
      }
      else
      {
        newLSystem += character;
      }
    }
    lsystem = newLSystem;
  }

  // used to rebind turtle to draw rules when we change turtles
  function setupDrawRules(turtle: Turtle)
  {
    drawRules.set('F', new DrawingRule(1.0, turtle.moveForward.bind(turtle), 1));
    drawRules.set('!', new DrawingRule(1.0, turtle.resize.bind(turtle, vec3.fromValues(0.5, 0.5, 0.5)), 1));
    drawRules.set('-', new DrawingRule(1.0, turtle.rotateZ.bind(turtle, -controls.rotation), 1));
    drawRules.set('^', new DrawingRule(1.0, turtle.rotateX.bind(turtle, -controls.rotation), 1));
    drawRules.set('&', new DrawingRule(1.0, turtle.rotateX.bind(turtle, controls.rotation), 1));
    drawRules.set('/', new DrawingRule(1.0, turtle.rotateY.bind(turtle, controls.rotation), 1));
    drawRules.set('[', new DrawingRule(1.0, turtleStack.push(Object.assign({}, turtle)), 1));
    drawRules.set(']', new DrawingRule(1.0, turtleStack.pop(), 1));
  }

  function pushTransform(transformArray: number[], mat: mat4)
  {
    // push elements of transformation matrix
    transformArray.push(mat[0]);
    transformArray.push(mat[1]);
    transformArray.push(mat[2]);
    transformArray.push(mat[3]);

    transformArray.push(mat[4]);
    transformArray.push(mat[5]);
    transformArray.push(mat[6]);
    transformArray.push(mat[7]);

    transformArray.push(mat[8]);
    transformArray.push(mat[9]);
    transformArray.push(mat[10]);
    transformArray.push(mat[11]);

    transformArray.push(mat[12]);
    transformArray.push(mat[13]);
    transformArray.push(mat[14]);
    transformArray.push(mat[15]);
  }

  let transformationsArray: number[] = [];

  // create turtle
  let turtle = new Turtle(vec3.fromValues(0, 0, 0), vec3.fromValues(controls.branchSize, controls.branchSize, controls.branchSize), 0);
  pushTransform(transformationsArray, turtle.getTransform());

  setupDrawRules(turtle);
  for (let character of lsystem)
  {
    let drawingRule = drawRules.get(character);
    if (drawingRule)
    {
      let func = drawingRule.getFunction();
      if (func)
      {
        let obj = func();
        if (obj)
        {
          if (obj instanceof Turtle )
          {
            // if func returned a turtle then we've popped a turtle off stack
            turtle = obj;
          }
          else if (obj instanceof mat4)
          {
            // if func returned a mat4 then we've moved the turtle
            pushTransform(transformationsArray, obj);
          }
        }
      }
    }
  }

  let transforms: Float32Array = new Float32Array(transformationsArray);

  // Set up instanced rendering data arrays here.
  // This example creates a set of positional
  // offsets and gradiated colors for a 100x100 grid
  // of squares, even though the VBO data for just
  // one square is actually passed to the GPU
  let offsetsArray = [];
  let colorsArray = [];
  let n: number = 20.0;
  for(let i = 0; i < n; i++) {
    for(let j = 0; j < n; j++) {
      offsetsArray.push(i);
      offsetsArray.push(j);
      offsetsArray.push(0);

      colorsArray.push(i / n);
      colorsArray.push(j / n);
      colorsArray.push(1.0);
      colorsArray.push(1.0); // Alpha channel
    }
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  cylinder.setInstanceVBOs(offsets, colors);
  cylinder.setNumInstances(n * n); // grid of "particles"
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.render(camera, flat, [screenQuad]);
    renderer.render(camera, instancedShader, [
      cylinder,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();

import {vec3, mat4} from 'gl-matrix';
const Stats = require('stats-js');
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
  secondaryRotation: 35,
  baseRotation: 27,
  branchiness: 0.9,
  branchSize: 1.0,
  color: [15, 113, 168, 1],
  color2: [237, 24, 56, 1],
  color3: [50, 23, 104, 1],
  'Load Scene': loadScene,
};

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let expansionRules: Map<string, ExpansionRule> = new Map();
let drawRules: Map<string, DrawingRule> = new Map();
let turtleStack: Turtle[] = [];
let meshPath = './models/cylinderRotated2Smooth.obj';
let cylinder: Mesh;

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

// adapted from https://stackoverflow.com/questions/14446447/how-to-read-a-local-text-file
function readTextFile(file: string)
{
    var rawFile = new XMLHttpRequest();
    let text: string;
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                text = rawFile.responseText;
            }
        }
    }
    rawFile.send(null);
    return text;
}

function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();
  let str = readTextFile(meshPath);
  cylinder = new Mesh(str, vec3.fromValues(0, 0, 0));
  cylinder.create();

  let turtleColor = vec3.fromValues(controls.color[0], controls.color[1], controls.color[2]);
  vec3.scale(turtleColor, turtleColor, 1.0 / 255.0);
  let turtleColor2 = vec3.fromValues(controls.color2[0], controls.color2[1], controls.color2[2]);
  vec3.scale(turtleColor2, turtleColor2, 1.0 / 255.0);
  let turtleColor3 = vec3.fromValues(controls.color3[0], controls.color3[1], controls.color3[2]);
  vec3.scale(turtleColor3, turtleColor3, 1.0 / 255.0);

  let lsystem = 'F!FA';

  // make expansion rules
  expansionRules.set('A', new ExpansionRule(1.0, "&[B]/[B]/[B]/[B]/[B]/[B]", "A"));
  //expansionRules.set('A', new ExpansionRule(1.0, "!&[B]/[B]", "A"));
  expansionRules.set('B', new ExpansionRule(controls.branchiness, "-$!F[C]B", "B"));
  expansionRules.set('C', new ExpansionRule(controls.branchiness, "!F^!F", "C"));

  // progress l system
  let lsteps: number = 8;
  for (let i = 0; i < lsteps; i++)
  {
    let newLSystem = '';
    for (let character of lsystem)
    {
      if (expansionRules.get(character))
      {
        newLSystem += expansionRules.get(character).getFunction();
      }
      else
      {
        newLSystem += character;
      }
    }
    lsystem = newLSystem;
  }

  console.log(lsystem);

  function pushTurtle(turtle: Turtle)
  {
    turtleStack.push(turtle.getCopy());
  }

  function popTurtle()
  {
    let turtlePop = turtleStack.pop();
    return turtlePop;
  }

  function lerpColor(turtle: Turtle, col: vec3)
  {
    vec3.lerp(turtleColor, turtleColor, col, 0.1);
    turtle.setColor(turtleColor);
  }

  // used to rebind turtle to draw rules when we change turtles
  function setupDrawRules(turtle: Turtle)
  {
    drawRules.set('F', new DrawingRule(1.0, turtle.moveForward.bind(turtle, 1.0), null));
    drawRules.set('!', new DrawingRule(1.0, turtle.resize.bind(turtle, 0.7, 0.7, 1.0), null));
    drawRules.set('-', new DrawingRule(0.5, turtle.rotateZ.bind(turtle, controls.rotation), turtle.rotateZ.bind(turtle, controls.secondaryRotation)));
    drawRules.set('^', new DrawingRule(0.5, turtle.rotateX.bind(turtle, -controls.rotation), turtle.rotateX.bind(turtle, -controls.secondaryRotation)));
    drawRules.set('&', new DrawingRule(0.5, turtle.rotateX.bind(turtle, controls.rotation), turtle.rotateX.bind(turtle, controls.secondaryRotation)));
    drawRules.set('/', new DrawingRule(1.0, turtle.rotateY.bind(turtle, controls.baseRotation), null));
    drawRules.set('[', new DrawingRule(1.0, pushTurtle.bind(this, turtle), null));
    drawRules.set(']', new DrawingRule(1.0, popTurtle.bind(this), null));
    drawRules.set('$', new DrawingRule(0.5, lerpColor.bind(this, turtle, turtleColor2), lerpColor.bind(this, turtle, turtleColor3)))
  }

  function pushTransform(transformArray1: number[], transformArray2: number[], transformArray3: number[], 
    transformArray4: number[], mat: mat4)
  {
    // push elements of transformation matrix
    transformArray1.push(mat[0]);
    transformArray1.push(mat[1]);
    transformArray1.push(mat[2]);
    transformArray1.push(mat[3]);

    transformArray2.push(mat[4]);
    transformArray2.push(mat[5]);
    transformArray2.push(mat[6]);
    transformArray2.push(mat[7]);

    transformArray3.push(mat[8]);
    transformArray3.push(mat[9]);
    transformArray3.push(mat[10]);
    transformArray3.push(mat[11]);

    transformArray4.push(mat[12]);
    transformArray4.push(mat[13]);
    transformArray4.push(mat[14]);
    transformArray4.push(mat[15]);
  }

  function pushColor(colArray: number[], col: vec3)
  {
    colArray.push(col[0]);
    colArray.push(col[1]);
    colArray.push(col[2]);
    colArray.push(1.0);
  }

  let transformationsArray1: number[] = [];
  let transformationsArray2: number[] = [];
  let transformationsArray3: number[] = [];
  let transformationsArray4: number[] = [];
  let colorsArray: number[] = [];


  let instances = 1;
  // create turtle
  let turtle = new Turtle(vec3.fromValues(0, 0, 0), vec3.fromValues(controls.branchSize, controls.branchSize, controls.branchSize), 
                          turtleColor, 0);
  pushTransform(transformationsArray1, transformationsArray2, transformationsArray3, transformationsArray4, turtle.getTransform(0));
  pushColor(colorsArray, turtle.getColor(0));

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
          if (obj instanceof Turtle)
          {
            // if func returned a turtle then we've popped a turtle off stack
            turtle = obj;
            // rebind turtle to draw rules
            setupDrawRules(turtle);
          }
          else
          {
            // if func returned a mat4 then we've moved the turtle
            for (let i = 0.0; i <= 1.0; i += 0.01)
            {
              pushTransform(transformationsArray1, transformationsArray2, transformationsArray3, transformationsArray4, turtle.getTransform(i));
              pushColor(colorsArray, turtle.getColor(i));
              instances += 1;
            }
          }
        }
      }
    }
  }

  let transforms1: Float32Array = new Float32Array(transformationsArray1);
  let transforms2: Float32Array = new Float32Array(transformationsArray2);
  let transforms3: Float32Array = new Float32Array(transformationsArray3);
  let transforms4: Float32Array = new Float32Array(transformationsArray4);
  let colors: Float32Array = new Float32Array(colorsArray);

  cylinder.setInstanceVBOs(transforms1, transforms2, transforms3, transforms4, colors);
  console.log(instances);
  cylinder.setNumInstances(instances);
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
  gui.add(controls, 'branchiness', 0.01, 1.0).step(0.01);
  gui.add(controls, 'rotation', 20.0, 35.0).step(0.01);
  gui.add(controls, 'secondaryRotation', 30.0, 45.0).step(0.01);
  gui.addColor(controls, 'color');
  gui.addColor(controls, 'color2');
  gui.addColor(controls, 'color3');
  gui.add(controls, 'Load Scene');

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

  const camera = new Camera(vec3.fromValues(0, 5, 0), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);
  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

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

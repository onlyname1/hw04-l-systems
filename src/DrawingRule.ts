export default class DrawingRule 
{
  probability: number;
  function1: any;
  function2: any;

  constructor(prob: number, fun1: any, fun2: any) 
  {
    this.probability = prob;
    this.function1 = fun1;
    this.function2 = fun2;
  }

  getFunction()
  {
    if (Math.random() < this.probability)
    {
      return this.function1;
    }
    else
    {
      return this.function2;
    }
  }
}
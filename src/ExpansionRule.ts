export default class ExpansionRule 
{
  probability: number;
  rule1: string;
  rule2: string;

  constructor(prob: number, rule1: any, rule2: any) 
  {
    this.probability = prob;
    this.rule1 = rule1;
    this.rule2 = rule2;
  }

  getFunction()
  {
    if (Math.random() < this.probability)
    {
      return this.rule1;
    }
    else
    {
      return this.rule2;
    }
  }
}
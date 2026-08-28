export class Junction {
  id: string;
  countcycle: number;
  greentime: number;
  intertime: number;

  constructor(id: string, countcycle: number = 0, greentime: number = 0, intertime: number = 0) {
    this.id = id;
    this.countcycle = countcycle;
    this.greentime = greentime;
    this.intertime = intertime;
  }
}
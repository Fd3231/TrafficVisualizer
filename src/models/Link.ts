export class Link {
  
  id: string;
  capacity: number;
  occupancy: number;
  counter: number;
  source: string;
  destination: string;
  active: boolean;
  
  constructor(id: string = "", capacity: number = 0, occupancy: number = 0, counter: number = 0, source: string = "", destination: string = "") {
    this.id = id;
    this.capacity = capacity;
    this.occupancy = occupancy;
    this.counter = counter;
    this.source = source;
    this.destination = destination;
    this.active = false;
  }

  }
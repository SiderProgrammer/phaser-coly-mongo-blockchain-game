export default class AlignGrid {
  constructor(config) {
    this.h = config.height;
    this.w = config.width;
    this.rows = config.rows;
    this.cols = config.cols;
    this.scene = config.scene;

    this.cw = this.w / this.cols;

    this.ch = this.h / this.rows;
  }
  show(a = 1) {
    this.graphics = this.scene.add.graphics();
    this.graphics.lineStyle(4, 0xff0000, a);
    //
    //
    //this.graphics.beginPath();
    for (var i = 0; i < this.w; i += this.cw) {
      this.graphics.moveTo(i, 0);
      this.graphics.lineTo(i, this.h);
    }
    for (var i = 0; i < this.h; i += this.ch) {
      this.graphics.moveTo(0, i);
      this.graphics.lineTo(this.w, i);
    }
    this.graphics.strokePath();
  }
  showNumbers(a = 1) {
    this.show(a);
    var n = 0;
    for (var i = 0; i < this.rows; i++) {
      for (var j = 0; j < this.cols; j++) {
        var numText = this.scene.add.text(0, 0, n, {
          color: "red",
        });
        numText.setOrigin(0.5, 0.5);
        this.placeAt(j, i, numText);
        n++;
      }
    }
  }
  placeAt(xx, yy, obj) {
    var x2 = this.cw * xx + this.cw / 2;
    var y2 = this.ch * yy + this.ch / 2;
    obj.x = x2;
    obj.y = y2;
  }
  placeAtIndex(index, obj) {
    var yy = Math.floor(index / this.cols);
    var xx = index - yy * this.cols;
    this.placeAt(xx, yy, obj);
  }
}

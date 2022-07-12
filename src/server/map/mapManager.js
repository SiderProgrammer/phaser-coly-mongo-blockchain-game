const mapData = require("./sampleMap");

class MapManager {
  constructor() {
    this.mapLayers = {
      ground: [],
      obstacles: [],
      lethals: [],
      objects: [],
    };

    this.setMapLayers();
  }

  setMapLayers() {
    Object.keys(this.mapLayers).forEach((layer) => {
      const layerToConvert = mapData.layers.find(
        (_layer) => _layer.name === layer
      );

      this.mapLayers[layer] = this.convertMapLayerFromJS(layerToConvert);
    });
  }

  convertMapLayerFromJS(layer) {
    const data = layer.data;
    const column = layer.width;
    const row = layer.height;

    const positions = [];

    let i = 0;
    for (let r = 0; r < row; ++r) {
      for (let c = 0; c < column; ++c) {
        if (data[i] !== 0) {
          positions.push({ x: c, y: r });
        }

        ++i;
      }
    }

    return positions;
  }

  getWorldMap() {
    // ? API will return this function execution //  app.get("/getWorldMap", mapManager.getWorldMap);
    return {
      ground: this.mapLayers.ground,
      obstacles: this.mapLayers.obstacles,
      mixed: [...this.mapLayers.lethals, ...this.mapLayers.objects], // ! we want to hide a layer type from a player so we mix these layers
    };
  }
}

module.exports = MapManager;

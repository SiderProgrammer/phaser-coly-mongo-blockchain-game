const mapData = require("./sampleMap");

class MapManager {
  constructor(scene) {
    this.scene = scene;

    this.mapLayers = {
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
          positions.push({ r, c });
        }

        ++i;
      }
    }

    return positions;
  }

  getWorldMap() {
    // ? API will return this function execution //  app.get("/getWorldMap", mapManager.getWorldMap);
    return this.mapLayers;
  }

  fetchObstacles(req, res) {
    res.status(200).json(this.mapLayers.obstacles);
  }
}

module.exports = MapManager;

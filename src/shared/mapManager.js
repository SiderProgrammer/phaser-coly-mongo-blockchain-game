class MapManager {
  constructor(scene, map) {
    this.scene = scene;
    this.map = map;

    this.mapLayers = {
      obstacles: [],
      lethals: [],
      objects: [],
      objects2: [],
      objects3: [],
      meta: [],
    };
    this.setMapLayers();
  }

  removeCollectedObjects(collectedObjects) {
    const objects = {
      1: this.mapLayers.objects,
      2: this.mapLayers.objects2,
      3: this.mapLayers.objects3,
    };

    for (const object in objects) {
      objects[object] = this.mapLayers.objects.filter((obj) => {
        return !collectedObjects.some(
          (collectedObj) => collectedObj.c === obj.c && collectedObj.r === obj.r
        );
      });
    }
  }

  setMapLayers() {
    Object.keys(this.mapLayers).forEach((layer) => {
      const layerToConvert = this.map.layers.find(
        (_layer) => _layer.name === layer
      );
      if (!layerToConvert) return;
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

  // fetchObstacles(req, res) {
  //   res.status(200).json(this.mapLayers.obstacles);
  // }
}

module.exports = MapManager;

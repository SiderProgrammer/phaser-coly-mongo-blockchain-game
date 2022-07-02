const { Client, Room } = require("colyseus");
// const { Constants, Maths, Models, Types } = require("@tosios/common");
const { GameState } = require("../states/GameState");

exports.default = class GameRoom extends Room {
  //
  // Lifecycle
  //
  onCreate(options) {
    // Set max number of clients for this room
    console.log("Room created");
    // this.maxClients = Maths.clamp(
    //     options.roomMaxPlayers || 0,
    //     Constants.ROOM_PLAYERS_MIN,
    //     Constants.ROOM_PLAYERS_MAX,
    // );

    // const playerName = options.playerName.slice(0, Constants.PLAYER_NAME_MAX);
    // const roomName = options.roomName.slice(0, Constants.ROOM_NAME_MAX);

    // // Init Metadata
    // this.setMetadata({
    //     playerName,
    //     roomName,
    //     roomMap: options.roomMap,
    //     roomMaxPlayers: this.maxClients,
    //     mode: options.mode,
    // });

    // // Init State
    this.setState(new GameState(this.handleMessage));

    this.setSimulationInterval(() => this.handleTick());

    // console.log(
    //     `${new Date().toISOString()} [Create] player=${playerName} room=${roomName} map=${options.roomMap} max=${
    //         this.maxClients
    //     } mode=${options.mode}`,
    // );

    //  Listen to messages from clients
    this.onMessage("*", (client, type, message) => {
      const playerId = client.sessionId;
      // console.log("Received message type: " + type);
      // Validate which type of message is accepted
      switch (type) {
        case "move":
          this.state.playerMove(playerId, message.ts, message.dir);
          break;
        case "select":
          this.state.playerSelectWizard(playerId, message.ts, message.wizardId);
          break;
        case "play-challenge":
          this.state.playChallenge(playerId, message.ts, message.wizardId);
          break;
        // case "rotate":
        // case "shoot":
        //   this.state.playerPushAction({
        //     playerId,
        //     ...message,
        //   });
        //   break;
        // default:
        //   break;
      }
    });
  }

  onJoin(client, options) {
    this.state.playerAdd(client.sessionId, options.playerName);
    console.log("New client joined!");
    //console.log(`${new Date().toISOString()} [Join] id=${client.sessionId} player=${options.playerName}`);
  }

  onLeave(client) {
    // this.state.playerRemove(client.sessionId);
    console.log("Client left");
    //  console.log(`${new Date().toISOString()} [Leave] id=${client.sessionId}`);
  }

  //
  // Handlers
  //
  handleTick = () => {
    this.state.update();
  };

  handleMessage = (message) => {
    console.log("New message sent!");
    this.broadcast(message.type, message);
  };
};

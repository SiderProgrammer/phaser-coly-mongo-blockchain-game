function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function calculateRegistrationPhaseRemainingTime(gameStateDB) {
  return (
    gameStateDB.gameStartTimestamp +
    gameStateDB.registrationPhaseDuration -
    Date.now() -
    gameStateDB.timeDifference
  );
}

function calculateDayRemainingTime(gameStateDB) {
  return (
    gameStateDB.gameStartTimestamp +
    gameStateDB.registrationPhaseDuration +
    gameStateDB.day * gameStateDB.dayDuration -
    Date.now() -
    gameStateDB.timeDifference
  );
}

module.exports = {
  randomInRange,
  calculateRegistrationPhaseRemainingTime,
  calculateDayRemainingTime,
};

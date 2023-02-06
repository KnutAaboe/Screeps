import roleBuilder, { Builder } from 'roles/builder';
import roleHarvester from 'roles/harvester';
import roleUpgrader, { Upgrader } from 'roles/upgrader';
import { ErrorMapper } from 'utils/ErrorMapper';
import { runTower } from './tower';

declare global {
  interface CreepMemory {
    role: 'harvester' | 'upgrader' | 'builder';
  }
}

function unwrappedLoop(): void {
  console.log(`Current game tick is ${Game.time}`);

  Object.values(Game.rooms).forEach(room => {
    if (room.controller?.my) {
      const spawn = room.find(FIND_MY_SPAWNS)[0]
      if (spawn) {
        const harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
        if (harvesters.length < 2) {
          var newName = 'Harvester' + Game.time;
          console.log('Spawning new harvester: ' + newName);
          spawn.spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: 'harvester' } });
        }
        const upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
        if (upgraders.length < 5) {
          var newName = 'upgrader' + Game.time;
          console.log('Spawning new upgrader: ' + newName);
          spawn.spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: 'upgrader' } });
        }
        const builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
        const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES).length
        if (builders.length < 1 && constructionSites > 0) {
          var newName = 'builder' + Game.time;
          console.log('Spawning new builder: ' + newName);
          spawn.spawnCreep([WORK, CARRY, MOVE], newName, { memory: { role: 'builder' } });
        }


        if (spawn.spawning) {
          var spawningCreep = Game.creeps[spawn.spawning.name];
          spawn.room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            spawn.pos.x + 1,
            spawn.pos.y,
            { align: 'left', opacity: 0.8 });
        }
      }



      const towers = room.find<StructureTower>(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });

      towers.forEach(tower => {
        runTower(tower);
      });
    }
  });

  Object.values(Game.creeps).forEach(creep => {
    if (creep.memory.role === 'harvester') {
      roleHarvester.run(creep);
    }
    if (creep.memory.role === 'upgrader') {
      roleUpgrader.run(creep as Upgrader);
    }
    if (creep.memory.role === 'builder') {
      roleBuilder.run(creep as Builder);
    }
  });

  // Automatically delete memory of missing creeps
  Object.keys(Memory.creeps)
    .filter(name => !(name in Game.creeps))
    .forEach(name => delete Memory.creeps[name]);
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
const loop = ErrorMapper.wrapLoop(unwrappedLoop);

export {
  loop,
  unwrappedLoop
};
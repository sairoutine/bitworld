'use strict';
var Level = function(ambient,floorTiles,wallTiles,tileDim,roomDim,roomMinSize) {
	this.tileDim = tileDim;
	this.roomDim = roomDim;
	this.roomMinSize = roomMinSize;
	this.floorTiles = floorTiles;
	this.wallTiles = wallTiles;
	this.ambient = ambient;
};

var levels = [
	new Level([0.1,0.1,0.0],[2,3,3,3,3,3],[2,3],[40,40],[4,4],[5,5]), // grass
	new Level([0.1,0.0,0.0],[1,2,3],[4],[40,40],[4,4],[4,4]), // wood walls
	new Level([0.0,0.0,0.1],[1],[1,2,17,32,33,34,50,51],[45,45],[5,5],[3,3]), // cave
	new Level([0.0,0.1,0.0],[16,17,19],[4],[50,50],[5,5],[3,3]), // wood dungeon
	new Level([0.05,0.0,0.0],[7],[5],[55,55],[6,6],[3,3]), // brick dungeon
	new Level([0.0,0.0,0.0],[176],[192],[55,55],[6,6],[3,3]), // sandstone dungeon
	new Level([0.0,0.0,0.0],[103],[104],[55,55],[6,6],[2,2]), // dark red/brown dungeon
	new Level([0.0,0.0,0.0],[167],[167],[55,55],[6,6],[1,1]) // obsidian dungeon
];

Level.getLevel = function(l) {
	// 2レベル毎にステージ移動
	return levels[Math.min(Math.floor(l/2), levels.length-1)];
};
module.exports = Level;

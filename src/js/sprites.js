'use strict';
var Sprite = require("./sprite");

var Sprites = function(gl, textureAtlas) {
	this.gl = gl;
	this.textureAtlas = textureAtlas;
	this.sprites = [];
	this.vertices = [];
	this.offsets = [];
	this.texCoords = [];
	this.indices = [];
	this.moving = [];
	this.flipped = [];
	this.baseIndex = 0;
	this.vertexObject = gl.createBuffer();
	this.texCoordObject = gl.createBuffer();
	this.offsetObject = gl.createBuffer();
	this.indexObject = gl.createBuffer();
	this.movingObject = gl.createBuffer();
	this.flippedObject = gl.createBuffer();
};
Sprites.prototype.numVertices = function() { return this.indices.length; };

Sprites.prototype.update = function() {
	var i;
	for (i=0; i<this.sprites.length; i++) {
		this.moveSprite(i,this.sprites[i].pos);
		this.flipSprite(i,this.sprites[i].flipped);
	}

	// Initialize buffer data
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexObject);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);

	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordObject);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.texCoords), this.gl.STATIC_DRAW);

	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.offsetObject);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.offsets), this.gl.STATIC_DRAW);

	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.movingObject);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.moving), this.gl.STATIC_DRAW);

	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.flippedObject);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.flipped), this.gl.STATIC_DRAW);

	this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexObject);
	this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);

	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

	for (i=0; i<this.sprites.length; i++) {
		this.sprites[i].moving = 0;
	}
};

Sprites.prototype.addSprite = function(tileNum, pos) {
	/* 1--0
	   |  |
	   2--3 */
	var o = [
		[ 0.5, 0.0, 1.0],
		[-0.5, 0.0, 1.0],
		[-0.5, 0.0, 0.0],
		[ 0.5, 0.0, 0.0]
	];
	this.sprites.push(new Sprite(pos));
	for (var i=0; i<4; i++) {
		this.vertices = this.vertices.concat(pos);
		this.offsets = this.offsets.concat(o[i]);
		this.moving.push(0);
		this.flipped.push(0);
	}
	var st = this.textureAtlas.getST(tileNum);

	this.texCoords = this.texCoords.concat(
		st[2], st[1], 
		st[0], st[1], 
		st[0], st[3],
		st[2], st[3]
	);

	this.indices.push(
		this.baseIndex, this.baseIndex+1, this.baseIndex+2,
		this.baseIndex, this.baseIndex+2, this.baseIndex+3
	);
	this.baseIndex += 4;
};

Sprite.prototype.flipSprite = function(spriteId, flipped) {
	for (var i=0; i<4; i++) {
		this.flipped[spriteId*4+i] = this.sprites[spriteId].flipped;
	}
};

Sprite.prototype.moveSprite = function(spriteId, pos) {
	for (var i=0; i<4; i++) {
		this.moving[spriteId*4+i] = this.sprites[spriteId].moving;
		for (var j=0; j<3; j++) 
			this.vertices[spriteId*12+i*3+j] = pos[j];
	}
};

Sprite.prototype.offsetSprite = function(spriteId, d) {
	for (var i=0; i<4; i++) 
		for (var j=0; j<3; j++) 
			this.vertices[spriteId*4+i*3+j] += d[j];
};



module.exports = Sprites;

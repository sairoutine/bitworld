'use strict';
var TextureAtlas = function(gl, url,tileSize) {
	this.gl = gl;
	this.tileSizePx = tileSize;
	this.imageSizePx = 0;
	this.tileSizeNormalized = 0;
	this.tilesPerRow = 0;
	this.paddingNormalized = 0;
	this.texture = null;

	this.loadImageTexture(url);
};

// Load from URL
TextureAtlas.prototype.loadImageTexture = function(url) {
	var atlas = this;
	var texture = this.gl.createTexture();
	texture.image = new Image();
	texture.image.onload = function() { atlas.handleTexture(texture.image, texture); };
	texture.image.src = url;
};

TextureAtlas.prototype.handleTexture = function(image, texture) {
	this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
	this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
	this.gl.bindTexture(this.gl.TEXTURE_2D, null);

	this.texture = texture;
	this.imageSizePx = image.width; // width must equal height

	this.tileSizeNormalized = this.tileSizePx/this.imageSizePx;
	this.paddingNormalized = 0.5/this.imageSizePx;
	this.tilesPerRow = Math.floor(this.imageSizePx/this.tileSizePx);
};

/** Based on tile number, get the s and t coordinate ranges of the tile.
	returns array of format [s1,t1,s2,t2] */
TextureAtlas.prototype.getST = function(tileNum) {
	var stRange = [
		this.tileSizeNormalized * (tileNum % this.tilesPerRow) + this.paddingNormalized,
		this.tileSizeNormalized * Math.floor(tileNum / this.tilesPerRow) + this.paddingNormalized,
	];
	stRange[2] = stRange[0] + this.tileSizeNormalized - this.paddingNormalized*1.5;
	stRange[3] = stRange[1] + this.tileSizeNormalized - this.paddingNormalized*1.5;
	return stRange;
};

module.exports = TextureAtlas;

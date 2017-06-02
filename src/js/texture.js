'use strict';

// gl: WebGLContext オブジェクト
// image: Image オブジェクト
// tilesizepx: 1キャラの px サイズ
var TextureAtlas = function(gl, image, tileSizePx) {
	this.imageSizePx = image.width; // width must equal height

	this.tileSizeNormalized = tileSizePx/this.imageSizePx;
	this.paddingNormalized = 0.5/this.imageSizePx;
	this.tilesPerRow = Math.floor(this.imageSizePx/tileSizePx);

	// 11. テクスチャを作成
	// image を texture に紐付け
	this.texture = gl.createTexture();
	this.handleTexture(gl, image, this.texture);
};

TextureAtlas.prototype.handleTexture = function(gl, image, texture) {
	// 12. 頂点バッファをバインドする
	gl.bindTexture(gl.TEXTURE_2D, texture);
	// 13. テクスチャへイメージを適用
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	// 13. ミップマップを生成
	gl.generateMipmap(gl.TEXTURE_2D);

	// 14. テクスチャパラメータの設定
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); //テクスチャが縮小される際の補間方法
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); //テクスチャが拡大される際の補間方法
	gl.bindTexture(gl.TEXTURE_2D, null);
};

/** Based on tile number, get the s and t coordinate ranges of the tile.
	returns array of format [s1,t1,s2,t2] */
/* テクスチャ画像のどこからどこまでを切り取るか。
 * 座標は小数点 */
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

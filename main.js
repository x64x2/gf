/*
 * jsSudoku Copyright 2014 Yaroslav Zotov zotovyaa@mail.ru
 */

var data = new Array(9) //this array is used to display digits
var initData = [[2,5,7,1,3,9,4,8,6],[9,6,3,8,5,4,1,7,2],[1,8,4,6,7,2,9,5,3],[6,1,2,7,9,8,5,3,4],[7,3,5,4,2,1,8,6,9],[4,9,8,5,6,3,7,2,1],[3,4,6,9,8,5,2,1,7],[8,7,1,2,4,6,3,9,5],[5,2,9,3,1,7,6,4,8]] //Awesome initial data. This array will be transformed to make new start conditions.
var trueData = new Array(9) //this array contains true digits (not inputed by user)
var initialData = new Array(81) //contains bool data: true if this cell is initially occupied with digit, else false
var trivial = 22, easy = 32, medium = 42, hard = 52, ultra = 58 //some preseted difficult levels
var difficultLevel = medium //number of cells to remove
var gameStyle = 0 //0 - default - new style, 1 - old javascript windows style
var remainingCells = 0
var currentIndex = 0 //for correct processing of popup window with digits to select
var popupVisible = 0 //1 when a popup window is visible
var hints = 0 //number of hints
var gameTimer = 0 //timer value
var startTimer = 0 //1 when we start gameTimer

function gameTimerToString() {
	var minutes = Math.floor(gameTimer/60).toString(), seconds = (gameTimer%60).toString()
	if (minutes.length == 1)
		minutes = "0" + minutes
	if (seconds.length == 1)
		seconds = "0" + seconds		
	return minutes + ':' + seconds
}

window.setInterval("if (startTimer) {gameTimer++; document.getElementById('timer').innerHTML = gameTimerToString()}", 1000) //

function resize() {
	var divAll = document.getElementById('all'), size = divAll.clientHeight
	divAll.style.left = window.innerWidth/2 - divAll.clientWidth/2
	divAll.style.top = window.innerHeight > size ? window.innerHeight/2 - size/2 : 0
	var overlay = document.getElementById('popup_overlay')
	overlay.style.width = window.innerWidth
	overlay.style.height = window.innerHeight > size ? window.innerHeight : size
	var popup = document.getElementById('popup'), height = popup.clientHeight == 0 ? 300 : popup.clientHeight
	popup.style.left = window.innerWidth/2 - (popup.clientWidth == 0 ? 112 : popup.clientWidth/2)
	popup.style.top = window.innerHeight > height ? window.innerHeight/2 - height/2 : 0
	var info = document.getElementById('info')
	height = info.clientHeight == 0 ? 200 : info.clientHeight
	info.style.left = window.innerWidth/2- (info.clientWidth == 0 ? 100 : info.clientWidth/2)
	info.style.top = window.innerHeight > height ? window.innerHeight/2 - height/2 : 0
}

function transposing() {
	var i = 0, j = 0
	for(i = 0; i < 9; i++)
		for(j = i; j < 9; j++) {
			var temp = trueData[i][j]
			trueData[i][j] = trueData[j][i]
			trueData[j][i] = temp				
		}
}

function genRandom(obj) {
	obj.square = Math.floor(Math.random() * 3);
	obj.n1 = Math.floor(Math.random() * 3), obj.n2 = Math.floor(Math.random() * 3)
	while (obj.n1 == obj.n2)
		obj.n2 = Math.floor(Math.random() * 3)
	obj.n1 += obj.square*3
	obj.n2 += obj.square*3
}

function swapRows() {
	var obj = new Object()
	obj.square = obj.n1 = obj.n2 = 0
	genRandom(obj)
	var temp = trueData[obj.n1].slice(0)
	trueData[obj.n1] = trueData[obj.n2].slice(0)
	trueData[obj.n2] = temp
}

function swapCols() {
	var obj = new Object()
	obj.square = obj.n1 = obj.n2 = 0
	genRandom(obj)
	var i = 0
	for (; i < 9; i++) {
		var temp = trueData[i][obj.n1]
		trueData[i][obj.n1] = trueData[i][obj.n2]
		trueData[i][obj.n2] = temp
	}
}

function swapRowsRegions() {
	var line1 = Math.floor(Math.random() * 3), line2 = Math.floor(Math.random() * 3), j
	while (line1 == line2)
		line2 = Math.floor(Math.random() * 3)
	line1 *= 3
	line2 *= 3
	for (j = 0; j < 3; j++) {
		var temp = trueData[line1 + j].slice(0)
		trueData[line1 + j] = trueData[line2 + j].slice(0)
		trueData[line2 + j] = temp
	}	
}

function swapColsRegions() {
	var col1 = Math.floor(Math.random() * 3), col2 = Math.floor(Math.random() * 3), i, j
	while (col1 == col2)
		col2 = Math.floor(Math.random() * 3)
	col1 *= 3
	col2 *= 3
	for (i = 0; i < 9; i++)
		for (j = 0; j < 3; j++) {
			var temp = trueData[i][col1 + j]
			trueData[i][col1 + j] = trueData[i][col2 + j]
			trueData[i][col2 + j] = temp
		}
}

function tryToSolve(tempData, y, x) { //Try to find correct digit for tempData[i][j]. If success return found digit else return "&nbsp"
	var variants = [1,2,3,4,5,6,7,8,9]
	for (var i = 0; i < 9; i++) {
		if (tempData[y][i] != "&nbsp" && variants.indexOf(tempData[y][i]) != -1)
			variants.splice(variants.indexOf(tempData[y][i]), 1)
		if (tempData[i][x] != "&nbsp" && variants.indexOf(tempData[i][x]) != -1)
			variants.splice(variants.indexOf(tempData[i][x]), 1)		
	}
	var col =  Math.floor(x/3), row = Math.floor(y/3)
	for (var i = col*3; i < col*3 + 3; i++)
		for (var j = row*3; j < row*3 + 3; j++)
			if (i != x && j != y && variants.indexOf(tempData[j][i]) != -1)
				variants.splice(variants.indexOf(tempData[j][i]), 1)
	if (variants.length == 1)
		return variants[0]
	else
		return "&nbsp"
}

function solveSudoku(tempData, remain) { //return true if field tempData can be solved (also fill tempData with correct digits) else return false
	while(1) {
		var prevRemain = remain; //save previous number of remaining cells
		for (var i = 0; i < 9; i++)
			for (var j = 0; j < 9; j++)
				if (tempData[i][j] == "&nbsp") {
					tempData[i][j] = tryToSolve(tempData, i, j)
					if (tempData[i][j] != "&nbsp") //reduce numer of remaining cells
						remain--					
					if (remain == 0)
						return true //we did it: we've solved sudoku.
				}
		if (remain == prevRemain) //if no cell was solved we can't solve this sudoku :-(
			return false
	}
}

function canSolve(index) { //return true if this field can be solved else return false
	var i, j, tempData = new Array(9), remain = remainingCells
	for(i = 0; i < 9; i++) {
		tempData[i] = new Array(9)
		for(j = 0; j < 9; j++)
			tempData[i][j] = data[i][j]
	}
	tempData[Math.floor(index/9)][index%9] = "&nbsp"
	if (solveSudoku(tempData, remain))
		return true
	else
		return false
}

function removeOneCell() {
	var index = Math.floor(Math.random() * 81)
	remainingCells++
	while (1) {
		if (initialData[index] && (difficultLevel == ultra || canSolve(index))) //if can be solved (or ultra level) break
			break
		else	
			index = Math.floor(Math.random() * 81)
	}
	initialData[index] = false
	data[Math.floor(index/9)][index%9] = "&nbsp"
}

function newGame() {
	var funcArray = [swapRows, swapCols, swapRowsRegions, swapColsRegions, transposing] //these functions are used to transform the field
	var i = 0, j = 0
	for (; i < 15; i++)
		funcArray[Math.floor(Math.random() * 5)]() //apply random function to the field*/
	for(i = 0; i < 9; i++)
		for(j = 0; j < 9; j++)	{
			data[i][j] = trueData[i][j]
			var obj = document.getElementById('td' + i + j)
			if (obj != null) 
				obj.removeAttribute('bgcolor') //to remove color from 'hinted' cells
		}
	for (i = 0; i < difficultLevel; i++)
		removeOneCell()
	currentIndex = 0
	popupVisible = 0
	gameTimer = 0
	startTimer = 1
	document.getElementById('timer').innerHTML = '00:00'
}

function init() {
	var i, j
	for(i = 0; i < 9; i++) {
		data[i] = new Array(9)
		trueData[i] = new Array(9)
		for(j = 0; j < 9; j++) {
			data[i][j] = trueData[i][j] = initData[i][j] //copy initial array
			initialData[i+j*9] = true //array for initial digits
		}
	}
	remainingCells = 0
	newGame() //generate new field
	hints = Math.floor((81 - difficultLevel)/15) //init number of max hints
	if (difficultLevel >= ultra)
		hints = 0
	document.getElementById('hintsSpan').innerHTML = hints
}

function wrongDigit(index, digit) {
	var x = index%9, y = Math.floor(index/9)
	var col =  Math.floor(x/3), row = Math.floor(y/3)
	for (var i = 0; i < 9; i++) {
		if (i != x && data[y][i] == digit)
			return true
		if (i != y && data[i][x] == digit)
			return true
	}
	for (var i = col*3; i < col*3 + 3; i++)
		for (var j = row*3; j < row*3 + 3; j++)
			if (i != x && j != y && data[j][i] == digit)
				return true
	return false
}

function showInfo(text) {
	popupVisible = 1
	document.getElementById('popup_overlay').style.display = 'block'
	document.getElementById('popup').style.display = 'none'
	var info = document.getElementById('info')
	info.style.display = 'block'
	info.innerHTML = text
	if (text.search('You win!') == -1) //restore line height for short texts (not victory text)
		info.style.lineHeight = '80px'
}

function showPopup() {
	document.getElementById('popup_overlay').style.display = 'block'
	document.getElementById('popup').style.display = 'block'
	popupVisible = 1
}

function hidePopup() {
	document.getElementById('popup_overlay').style.display = 'none'
	document.getElementById('popup').style.display = 'none'
	document.getElementById('info').style.display = 'none'	
	popupVisible = 0
}

function handleKey(event) {
	if (event.keyCode == 27 || event.keyCode == 13) //Escape or Enter pressed
		hidePopup()
	if (popupVisible) {
		var digit = String.fromCharCode(event.which)
		if (digit >= '0' && digit <= '9')
			enterDigit(parseInt(digit))
	}
}

function enterDigit(digit) {
	var x = currentIndex%9, y = Math.floor(currentIndex/9)
	if (digit == 0) { //clear cell
		if (data[y][x] != '&nbsp')
			remainingCells++
		data[y][x] = document.getElementById('td' + y + x).innerHTML = '&nbsp'	
	}
	else {
		if (wrongDigit(currentIndex, digit)) {
			showInfo("Wrong digit!")
			return
		}
		if (data[y][x] == '&nbsp')
			remainingCells--
		data[y][x] = document.getElementById('td' + y + x).innerHTML = digit
	}
	hidePopup()
	if (remainingCells == 0) //victory checking
		victory()
}

function handleClick(obj) {
	var index = parseInt(parseInt(obj.id[2]*9) + parseInt(obj.id[3])), flag = false
	if (!initialData[index]) {//Don't allow to modify initial digits.
		if (gameStyle == 0) {
			currentIndex = index
			showPopup()
		} else {
			var temp = prompt("Input your digit here") //read user's digit
			if (temp == null)
				return
			if (temp.match(/^\d$/)) { //Is digit?
				if (temp != '0')
					flag = true
			}
			if (temp.length == 0 || temp == '0') { //clear cell
				if (data[obj.id[2]][obj.id[3]] != '&nbsp')
					remainingCells++
				data[obj.id[2]][obj.id[3]] = obj.innerHTML = '&nbsp'
			}
			if (flag) {
				if (wrongDigit(index, temp)) {
					alert("Wrong digit")
					return
				}
				if (data[obj.id[2]][obj.id[3]] == '&nbsp')
					remainingCells--
				data[obj.id[2]][obj.id[3]] = obj.innerHTML = temp
			}
			if (remainingCells == 0) //victory checking
				alert('You win!')
		}
	}	
}

function redraw() {
	for(var i = 0; i < 9; i++)
		for(var j = 0; j < 9; j++)
			document.getElementById('td' + i+j).innerHTML = "<b>" + data[i][j] + "</b>"
}

function hint() {
	document.getElementById('hint').blur()
	if (hints == 0) {
		showInfo("No more hints")
		return
	}
	document.getElementById('hintsSpan').innerHTML = --hints
	var index = Math.floor(Math.random() * 81)
	while (1) {
		if (initialData[index] || data[Math.floor(index/9)][index%9] != "&nbsp") 
			index = Math.floor(Math.random() * 81)
		else	
			break
	}
	var x = index%9, y = Math.floor(index/9)
	document.getElementById('td' + y + x).innerHTML = data[y][x] = trueData[y][x]
	document.getElementById('td' + y + x).setAttribute('bgcolor', '#B4CDCD')
	showInfo("Hint: (" + (x + 1) + ", " + (y + 1) + ') = ' + trueData[y][x])
	if (--remainingCells == 0) //victory checking
		victory()
}

function victory() {
	startTimer = 0
	document.getElementById('info').style.lineHeight = '40px'
	showInfo("You win! <br>Your time is " + gameTimerToString())

}


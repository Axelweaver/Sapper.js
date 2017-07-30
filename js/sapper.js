$(document).ready(function () {
    $(document).delegate("button[data-toggle='change-size']", "click", changeSizeHandler);
    loadGame();
});
function loadGame() {
    $("div.panel.sapper-table:first>.panel-heading>.panel-title span.bombs-refresh").remove();
    $("div.panel.sapper-table:first>.panel-heading>.panel-title span.bombs-count-icon").remove();
    $("div.panel.sapper-table:first>.panel-heading>.panel-title span.timer").remove();
    $("div.panel.sapper-table:first>.panel-heading>.panel-title span.bombs-count").remove();
    // количество строк
    var rowsCount = parseInt($("table.sapper-table").attr("data-rows-count"));
    // количество колонок
    var columnsCount = parseInt($("table.sapper-table").attr("data-columns-count"));
    // количество бомб
    var bombCount = parseInt($("table.sapper-table").attr("data-bomb-count"));
    // бомбы
    var bombs = [];
    // индексы
    var rowIndex, columnIndex;
    // секунды таймера
    var seconds = 0;
    // игра окончена
    var gameOver = false;
    // использование Math.round() даст неравномерное распределение!
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    // Случайное число для колонки от 0 до кол-ва столбцов -1
    function getRandomColumnIndex() {
        return getRandomInt(0, columnsCount - 1);
    }
    // Случайное число для строки от 0 до кол-ва строк -1
    function getRandomRowIndex() {
        return getRandomInt(0, rowsCount - 1);
    }
    // Создать бомбу со случайными координатами
    function getBomb() {
        return [getRandomRowIndex(), getRandomColumnIndex()];
    }
    // Проверить существование бомбы по массиву с координатами
    function checkBomb(bmb) {
        var exists = false;
        for (var b = 0; b < bombs.length; b++) {
            if (bmb[0] === bombs[b][0] && bmb[1] === bombs[b][1]) {
                exists = true;
                break;
            }
        }
        return exists;
    }
    // получить ячейку
    function getCell(ri, ci) {
        return $("table.sapper-table>tbody>tr>td>div[data-row='" + ri + "'][data-column='" + ci + "']");
    }
    // получить массив с координатами ячейки
    function getCoord(cell) {
        var rowIndex = parseInt(cell.attr("data-row"));
        var columnIndex = parseInt(cell.attr("data-column"));
        return [rowIndex, columnIndex];
    }
    // проверка ячейки, что она ещё не открыта
    function checkCell(ri, ci) {
        var cell = getCell(ri, ci);
        return cell.hasClass("cell-closed") && cell.attr("data-flag") === undefined;
    }
    // завершить игру
    function setGameOver() {
        gameOver = true;
        var table = $("table.sapper-table:first");
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.setAttribute("colspan", columnsCount);
        td.setAttribute("class", "game-over");
        td.innerHTML = "Game Over";
        tr.appendChild(td);
        table.append(tr);
    }
    // проверить ячейки вокруг ячейки с указанными координатами
    function lookAround(ri, ci, funct) {
        var bombsArroundCount = 0;
        var beginRowIndex = ri === 0 ? 0 : ri - 1;
        var endRowIndex = ri === rowsCount - 1 ? rowsCount - 1 : ri + 1;
        var beginColumnIndex = ci === 0 ? 0 : ci - 1;
        var endColumnIndex = ci === columnsCount - 1 ? columnsCount - 1 : ci + 1;
        for (var bri = beginRowIndex; bri <= endRowIndex; bri++) {
            for (var bci = beginColumnIndex; bci <= endColumnIndex; bci++) {
                if (ri === bri && ci === bci) {
                    continue;
                }
                funct(bri, bci);
            }
        }
        return bombsArroundCount;
    }

    // очистить ячейки вокруг с проверкой вокруг пустых ячеек
    function clearAround(ri, ci) {
        lookAround(ri, ci, function (ri2, ci2) {
            if (checkCell(ri2, ci2)) {
                clearCell(ri2, ci2);
                if (countBombsAround(ri2, ci2) === 0) {
                    clearAround(ri2, ci2);
                } else {
                    drawNumber(ri2, ci2);
                }
            }
        });
    }
    // подсчитать кол-во бомб вокруг ячейки по её координатам
    function countBombsAround(ri, ci) {
        var count = 0;
        lookAround(ri, ci, function (ri2, ci2) {
            if (checkBomb([ri2, ci2])) {
                count++;
            }
        });
        return count;
    }
    // нарисовать бомбу в ячейке
    function addBomb(ri, ci) {
        var cell = getCell(ri, ci);
        clearCell(ri, ci);
        cell.removeClass("glyphicon-map-marker")
            .removeClass("cell-closed")
            .removeAttr("data-flag")
            .addClass("glyphicon")
            .addClass("glyphicon-remove-sign")
            .addClass("cell-bomb");
    }
    // Отобразить все бомбы
    function drawAllBombs() {
        for (var q = 0; q < bombs.length; q++) {
            addBomb(bombs[q][0], bombs[q][1]);
        }
        displayLose();
    }
    // очистить ячейку
    function clearCell(ri, ci) {
        if (!checkCell(ri, ci)) {
            return;
        }
        var cell = getCell(ri, ci);
        cell.removeClass("cell-closed");
        unbindClickHandler(cell);
    }
    // проставить число количества бомб вокруг ячейки
    function drawNumber(ri, ci) {

        var cell = getCell(ri, ci);
        // подсчитаем количество бомб вокруг ячеек
        var count = countBombsAround(ri, ci);
        // очистим ячейку
        clearCell(ri, ci);
        if (count > 0) {
            // если вокруг есть бомбы, то рисуем цифру
            cell.text(count);
            cell.addClass("cell-number")
                .addClass("number" + count);
        } else {
            // иначе очищаем ячейки вокруг
            clearAround(ri, ci);
        }
    }
    // Добавить отметку бомбы (флаг)
    function addFlag(ri, ci) {
        var cell = getCell(ri, ci);
        if (cell.attr("data-flag") === "true") {
            cell.removeClass("glyphicon")
                .removeClass("glyphicon-map-marker")
                .removeAttr("data-flag");
        } else {
            if (getCountNotMarkedBombs() <= 0) {
                return false;
            }
            cell.addClass("glyphicon")
                .addClass("glyphicon-map-marker")
                .attr("data-flag", "true");
        }
        displayCountBombs();
        if (getCountNotMarkedBombs() <= 0) {
            checkAllMarkers();
        }
    }

    // создать бомбы
    function createBombs() {
        bombs = [];
        for (var i = 0; i < bombCount; i++) {
            var bomb = getBomb();
            // если бомба с такими координатами уже есть, то пересоздадим
            while (checkBomb(bomb)) {
                bomb = getBomb();
            }
            bombs.push(bomb);
        }
    }

    // Обновить время на таймере
    function updateTimer() {
        if (gameOver) {
            stopTimer();
            return;
        }
        var date = new Date(seconds * 1000);
        var span = $("div.panel.sapper-table:first>.panel-heading>.panel-title span.timer");
        span.text(date.toTimeString().substr(3, 5));
        if ($("table.sapper-table[data-timer]").length < 1) {
            return;
        }
        seconds++;
        setTimeout(updateTimer, 1000);
    }
    // Запустить таймер
    function startTimer() {
        seconds = 0;
        $("table.sapper-table").attr("data-timer", "true");
        updateTimer();
    }
    // Остановить таймер
    function stopTimer() {
        $("table.sapper-table").removeAttr("data-timer");
    }
    // убрать обработчик нажатия на ячейку
    function unbindClickHandler(cell) {
        $(cell).unbind("click", clickHandler);
        $(cell).unbind("mousedown", clickHandler);
    }
    function mousedownHandler(e) {
        //e.cancelBubble = true;
        //e.preventDefault();
        var cell = $(this);
        if (!cell.hasClass("cell-closed")) {
            return false;
        }
        var coord = getCoord(cell);
        if (e.button === 2) {
            addFlag(coord[0], coord[1]);
            return false;
        }

        e.returnValue = false;
        //return false;
    }
    // обработчик нажатия на ячейку
    function clickHandler(e) {
        e.preventDefault();
        if ($("table.sapper-table[data-timer]").length < 1) {
            startTimer();
        }
        var cell = $(this);
        // Если на ячейке стоит метка, то выйдем
        if (cell.attr("data-flag") === "true") {
            return;
        }
        // координаты ячейки
        var coord = getCoord(cell);
        // проверим нажатую ячейку на существование бомбы в ней
        if (checkBomb(coord)) {
            // покажем все бомбы
            drawAllBombs();
        } else {
            // нарисуем цифру или очистим ячейки
            drawNumber(coord[0], coord[1]);
            //clearAround(ri, ci);
        }
    }
    // Считаем количество оставшихся маркеров
    function getCountNotMarkedBombs() {
        var count = bombCount - $("table.sapper-table:first>tbody>tr>td>div[data-flag]").length;
        return count;
    }
    // Отобразить оставшееся количество бомб
    function displayCountBombs() {
        var span = $("div.panel.sapper-table:first>.panel-heading>.panel-title span.bombs-count");
        span.text(getCountNotMarkedBombs());
    }
    // Отобразить победу
    function displayWin() {
        stopTimer();
        var spanWin = document.createElement("span");
        $(spanWin).addClass("text-win").text("You win!");
        $("div.panel.sapper-table:first>.panel-heading>.panel-title").append(spanWin);
        setGameOver();
    }
    // Отобразить проигрыш
    function displayLose() {
        stopTimer();
        var spanLose = document.createElement("span");
        $(spanLose).addClass("text-lose").text("You lose!");
        $("div.panel.sapper-table:first>.panel-heading>.panel-title").append(spanLose);
        setGameOver();
    }
    // Проверить все маркеры, что они были верно установлены
    function checkAllMarkers() {
        var all = true;
        console.log($("table.sapper-table:first>tbody>tr>td>div[data-flag]").length);
        $("table.sapper-table:first>tbody>tr>td>div[data-flag]").each(function () {
            var cell = $(this);
            var coord = getCoord(cell);
            if (!checkBomb(coord)) {
                all = false;
                return false;
            }
        });

        if (all) {
            displayWin();
        } else {
            alert("Not win. Check your markers");
        }
    }
    // создадим игровое поле, расставим индексы в ячейках и установим обработчики нажатия
    function createField() {
        createBombs();
        var table = $("table.sapper-table:first");
        table.html("");
        seconds = 0;
        stopTimer();
        updateTimer();
        var tbody = document.createElement("tbody");

        for (var j = 0; j < rowsCount; j++) {
            var tr = document.createElement("tr");
            rowIndex = j;
            for (var k = 0; k < columnsCount; k++) {
                var td = document.createElement("td");
                var cell = document.createElement("div");

                columnIndex = k;
                $(cell).dblclick("dblclick", mousedownHandler);
                $(cell).addClass("cell-closed")
                    .attr("data-row", rowIndex)
                    .attr("data-column", columnIndex)
                    .click(clickHandler);
                // Устанавливаем обработчик правой кнопки мыши
                cell.oncontextmenu = mousedownHandler;
                td.appendChild(cell);
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        table.append(tbody);
        // Создадим или обновим счётчик оставшихся бомб
        var spanCountBombs = $("div.panel.sapper-table:first>.panel-heading>.panel-title span.bombs-count");
        if (spanCountBombs.length < 1) {
            var spanCbIcon = document.createElement("span");
            $(spanCbIcon).addClass("glyphicon")
                .addClass("glyphicon-remove-sign")
                .addClass("bombs-count-icon");
            var spanCb = document.createElement("span");
            $(spanCb).addClass("bombs-count").text(bombCount);
            $("div.panel.sapper-table:first>.panel-heading>.panel-title").append(spanCbIcon);
            $("div.panel.sapper-table:first>.panel-heading>.panel-title").append(spanCb);

        } else {
            spanCountBombs.text(getCountNotMarkedBombs());
        }
        // Создадим отображения таймера
        var spanTimer = $("div.panel.sapper-table:first>.panel-heading>.panel-title span.bombs-refresh");
        if (spanTimer.length < 1) {
            var spTmr = document.createElement("span");
            $(spTmr).addClass("timer");
            $("div.panel.sapper-table:first>.panel-heading>.panel-title").append(spTmr);
        }
        $("div.panel.sapper-table:first>.panel-heading>.panel-title span.text-win").remove();
        $("div.panel.sapper-table:first>.panel-heading>.panel-title span.text-lose").remove();
        // Кнопка новой игры
        var spanRefresh = $("div.panel.sapper-table:first>.panel-heading>.panel-title span.bombs-refresh");
        if (spanRefresh.length < 1) {
            var spRfsh = document.createElement("span");
            $(spRfsh).addClass("pull-right")
                .addClass("glyphicon")
                .addClass("glyphicon-repeat")
                .addClass("bombs-refresh")
                .click(createField);
            $("div.panel.sapper-table:first>.panel-heading>.panel-title").append(spRfsh);

        }

    }
    createField();
}

function changeSizeHandler(e) {
    e.preventDefault();
    var button = $(this);
    var attrs = ["data-rows-count", "data-columns-count", "data-bomb-count"];
    for (var i = 0; i < attrs.length; i++) {
        $("table.sapper-table:first").attr(attrs[i], button.attr(attrs[i]));
    }
    var columns = parseInt(button.attr("data-columns-count"));
    var width = columns * 30 + 2;
    $("div.panel.sapper-table:first").width(width);
    loadGame();
}

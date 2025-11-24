/**
 * 欢乐棋牌室 - 核心逻辑
 */

// --- 1. 游戏数据库 (30款) ---
const GAMES = [
    // 类别: 智能对战
    { cat: '智能对战', id: 'gomoku', name: '五子棋', icon: '⚫', type: 'ai', rule: '五子连珠获胜' },
    { cat: '智能对战', id: 'reversi', name: '黑白棋', icon: '⚪', type: 'ai', rule: '夹住对方棋子翻转，子多者胜' },
    { cat: '智能对战', id: 'connect4', name: '四子棋', icon: '🔴', type: 'ai', rule: '四子连线获胜（重力下落）' },
    { cat: '智能对战', id: 'tictactoe', name: '井字棋', icon: '❌', type: 'ai', rule: '三子连线获胜' },
    { cat: '智能对战', id: 'peg', name: '孔明棋', icon: '🔮', type: 'solo', rule: '跳过棋子吃掉，最后剩一颗' },

    // 类别: 休闲益智
    { cat: '休闲益智', id: 'minesweeper', name: '扫雷', icon: '💣', type: 'solo', rule: '点击开格子，长按插旗' },
    { cat: '休闲益智', id: 'memory', name: '记忆翻牌', icon: '🎴', type: 'solo', rule: '翻开两张相同的牌消除' },
    { cat: '休闲益智', id: '2048', name: '2048', icon: '🔢', type: 'solo', rule: '键盘/滑动合并数字' },
    
    // 类别: 自由沙盒
    { cat: '自由沙盒', id: 'xiangqi', name: '中国象棋', icon: '♟️', type: 'sandbox', preset: 'xiangqi' },
    { cat: '自由沙盒', id: 'chess', name: '国际象棋', icon: '♔', type: 'sandbox', preset: 'chess' },
    { cat: '自由沙盒', id: 'go', name: '围棋 (自由)', icon: '🔲', type: 'sandbox', preset: 'go' },
    { cat: '自由沙盒', id: 'checkers', name: '西洋跳棋', icon: '🔘', type: 'sandbox', preset: 'checkers' },
    { cat: '自由沙盒', id: 'shogi', name: '日本将棋', icon: '🏯', type: 'sandbox', preset: 'shogi' },
    { cat: '自由沙盒', id: 'ludo', name: '飞行棋', icon: '✈️', type: 'sandbox', preset: 'ludo' },
    { cat: '自由沙盒', id: 'backgammon', name: '双陆棋', icon: '🎲', type: 'sandbox', preset: 'bg' },
    
    // 更多沙盒棋类
    { cat: '更多棋类', id: 'animal', name: '斗兽棋', icon: '🦁', type: 'sandbox', preset: 'grid_4x9' },
    { cat: '更多棋类', id: 'army', name: '军棋', icon: '🚩', type: 'sandbox', preset: 'grid_5x12' },
    { cat: '更多棋类', id: 'nine', name: '九子棋', icon: '🕸️', type: 'sandbox', preset: 'grid_7x7' },
    { cat: '更多棋类', id: 'six', name: '六子棋', icon: '❇️', type: 'sandbox', preset: 'grid_hex' },
    { cat: '更多棋类', id: 'fox', name: '狐狸与鹅', icon: '🦊', type: 'sandbox', preset: 'cross' },
    { cat: '更多棋类', id: 'amazon', name: '亚马逊棋', icon: '🏹', type: 'sandbox', preset: 'grid_10x10' },
    { cat: '更多棋类', id: 'surakarta', name: '苏拉卡尔塔', icon: '🌀', type: 'sandbox', preset: 'grid_6x6' },
    { cat: '更多棋类', id: 'mancala', name: '播棋', icon: '💊', type: 'sandbox', preset: 'mancala' },
    { cat: '更多棋类', id: 'battleship', name: '海战棋', icon: '🚢', type: 'sandbox', preset: 'grid_10x10' },
    { cat: '更多棋类', id: 'dots', name: '点格棋', icon: '⬜', type: 'sandbox', preset: 'grid_dots' },
    { cat: '更多棋类', id: 'yot', name: '由取棋', icon: '🎎', type: 'sandbox', preset: 'grid_5x5' },
    { cat: '更多棋类', id: 'domino', name: '多米诺', icon: '🀄', type: 'sandbox', preset: 'empty' },
    { cat: '更多棋类', id: 'bridge', name: '桥牌 (记分板)', icon: '🃏', type: 'sandbox', preset: 'cards' },
    { cat: '更多棋类', id: 'mahjong', name: '二人麻将', icon: '🀄', type: 'sandbox', preset: 'mj' },
    { cat: '更多棋类', id: 'werewolf', name: '狼人棋', icon: '🐺', type: 'sandbox', preset: 'grid_5x5' }
];

// --- 2. 核心控制器 ---
const Engine = {
    currentGame: null,
    boardData: [],
    history: [],
    turn: 1, // 1: Player/Black, 2: AI/White
    isOver: false,

    init() {
        UI.renderList();
        this.load('gomoku');
    },

    load(id) {
        const game = GAMES.find(g => g.id === id);
        this.currentGame = game;
        this.isOver = false;
        this.turn = 1;
        this.history = [];
        UI.updateTitle(game);
        UI.closeMenu();

        const wrap = document.getElementById('board-wrap');
        wrap.className = 'board-wrap'; 
        wrap.innerHTML = ''; 

        if (game.type === 'ai') LogicAI.init(game);
        else if (game.type === 'solo') LogicSolo.init(game);
        else if (game.type === 'sandbox') LogicSandbox.init(game);
    },

    restart() {
        this.load(this.currentGame.id);
    },

    undo() {
        if (this.currentGame.type === 'solo') return;
        if (this.history.length < 1) return;
        
        const state = this.history.pop();
        this.boardData = JSON.parse(JSON.stringify(state.board));
        this.turn = state.turn;
        this.isOver = false;
        
        if (this.currentGame.type === 'ai') LogicAI.render();
        else if (this.currentGame.type === 'sandbox') LogicSandbox.render();
        
        UI.setStatus('已悔棋');
    },

    saveState() {
        this.history.push({
            board: JSON.parse(JSON.stringify(this.boardData)),
            turn: this.turn
        });
    }
};

// --- 3. AI 对战逻辑模块 ---
const LogicAI = {
    config: {},
    
    init(game) {
        const wrap = document.getElementById('board-wrap');
        wrap.classList.add(game.id === 'tictactoe' ? 'skin-paper' : (game.id === 'reversi' ? 'skin-green' : (game.id==='connect4'?'skin-blue':'skin-wood')));
        
        if (game.id === 'gomoku') this.setupGrid(15, 15);
        else if (game.id === 'reversi') {
            this.setupGrid(8, 8);
            Engine.boardData[3][3]=2; Engine.boardData[3][4]=1; 
            Engine.boardData[4][3]=1; Engine.boardData[4][4]=2;
        }
        else if (game.id === 'connect4') this.setupGrid(7, 6);
        else if (game.id === 'tictactoe') this.setupGrid(3, 3);
        
        this.render();
        UI.setStatus('你的回合');
    },

    setupGrid(w, h) {
        this.config = { w, h };
        Engine.boardData = Array(h).fill().map(() => Array(w).fill(0));
    },

    render() {
        const wrap = document.getElementById('board-wrap');
        wrap.innerHTML = '';
        const board = document.createElement('div');
        board.className = 'board';
        
        const size = Engine.currentGame.id === 'tictactoe' ? 100 : (Engine.currentGame.id === 'gomoku' ? 30 : 45);
        board.style.gridTemplateColumns = `repeat(${this.config.w}, ${size}px)`;
        
        for (let y = 0; y < this.config.h; y++) {
            for (let x = 0; x < this.config.w; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.width = size + 'px';
                cell.style.height = size + 'px';
                cell.onclick = () => this.playerMove(x, y);
                
                const val = Engine.boardData[y][x];
                if (val !== 0) {
                    const p = document.createElement('div');
                    p.className = `piece ${val === 1 ? 'b' : 'w'} show`;
                    if (Engine.currentGame.id === 'tictactoe') {
                        p.innerText = val === 1 ? '❌' : '⭕';
                        p.style.background = 'none'; p.style.fontSize='2rem'; p.style.boxShadow='none';
                        p.style.color = val===1?'#ff6b6b':'#4ecdc4';
                    }
                    if (Engine.currentGame.id === 'connect4') {
                        p.style.background = val===1 ? '#e74c3c' : '#f1c40f';
                    }
                    cell.appendChild(p);
                } else if (Engine.currentGame.id === 'reversi' && Engine.turn===1 && this.canFlip(x,y,1)) {
                     const hint = document.createElement('div'); hint.className='hint';
                     cell.appendChild(hint);
                }
                board.appendChild(cell);
            }
        }
        wrap.appendChild(board);
    },

    playerMove(x, y) {
        if (Engine.isOver || Engine.turn !== 1) return;
        
        if (Engine.currentGame.id === 'connect4') {
            y = this.getDropRow(x);
            if (y === -1) return;
        } else {
            if (Engine.boardData[y][x] !== 0) return;
            if (Engine.currentGame.id === 'reversi' && !this.canFlip(x,y,1)) return;
        }

        Engine.saveState();
        this.executeMove(x, y, 1);

        if (this.checkWin(x, y, 1)) {
            Engine.isOver = true; UI.setStatus('🎉 你赢了！'); return;
        }
        if (this.checkDraw()) {
            Engine.isOver = true; UI.setStatus('🤝 平局'); return;
        }

        Engine.turn = 2;
        UI.setStatus('AI 思考中...');
        setTimeout(() => this.aiMove(), 500);
    },

    executeMove(x, y, p) {
        Engine.boardData[y][x] = p;
        if (Engine.currentGame.id === 'reversi') {
            this.getFlips(x, y, p).forEach(pt => Engine.boardData[pt.y][pt.x] = p);
        }
        this.render();
    },

    aiMove() {
        if (Engine.isOver) return;
        
        let bestMove = null;
        const moves = this.getValidMoves();

        // 1. 尝试赢
        for (let m of moves) {
            Engine.boardData[m.y][m.x] = 2;
            if (this.checkWin(m.x, m.y, 2)) {
                bestMove = m; Engine.boardData[m.y][m.x] = 0; break;
            }
            Engine.boardData[m.y][m.x] = 0;
        }

        // 2. 尝试堵
        if (!bestMove) {
            for (let m of moves) {
                Engine.boardData[m.y][m.x] = 1;
                if (this.checkWin(m.x, m.y, 1)) {
                    bestMove = m; Engine.boardData[m.y][m.x] = 0; break;
                }
                Engine.boardData[m.y][m.x] = 0;
            }
        }

        // 3. 随机/权重
        if (!bestMove && moves.length > 0) {
            if (Engine.currentGame.id === 'reversi') {
                bestMove = moves.reduce((prev, curr) => {
                   const score = (curr.x===0||curr.x===7) && (curr.y===0||curr.y===7) ? 100 : this.getFlips(curr.x, curr.y, 2).length;
                   return score > prev.score ? {move:curr, score} : prev;
                }, {move:moves[0], score:-1}).move;
            } else {
                bestMove = moves[Math.floor(Math.random() * moves.length)];
            }
        }

        if (bestMove) {
            this.executeMove(bestMove.x, bestMove.y, 2);
            if (this.checkWin(bestMove.x, bestMove.y, 2)) {
                Engine.isOver = true; UI.setStatus('🤖 AI 赢了');
            } else if (this.checkDraw()) {
                Engine.isOver = true; UI.setStatus('🤝 平局');
            } else {
                Engine.turn = 1; UI.setStatus('轮到你了');
                if (Engine.currentGame.id === 'reversi' && this.getValidMoves(1).length === 0) {
                     UI.setStatus('你无子可下，AI 继续');
                     setTimeout(() => this.aiMove(), 1000);
                }
            }
        } else {
            Engine.turn = 1; 
            UI.setStatus('AI 跳过，轮到你');
        }
    },

    getValidMoves(player = 2) {
        let moves = [];
        for(let y=0; y<this.config.h; y++) {
            for(let x=0; x<this.config.w; x++) {
                if (Engine.currentGame.id === 'connect4') {
                    if (y===0 && Engine.boardData[0][x]===0) moves.push({x, y: this.getDropRow(x)});
                }
                else if (Engine.boardData[y][x] === 0) {
                    if (Engine.currentGame.id !== 'reversi' || this.canFlip(x,y,player)) {
                        moves.push({x,y});
                    }
                }
            }
        }
        if(Engine.currentGame.id === 'connect4') {
            moves = [...new Set(moves.map(m => m.x))].map(x => ({x, y:this.getDropRow(x)}));
        }
        return moves;
    },

    getDropRow(x) {
        for(let y = this.config.h - 1; y >= 0; y--) if(Engine.boardData[y][x] === 0) return y;
        return -1;
    },

    checkWin(x, y, p) {
        const dirs = [[1,0], [0,1], [1,1], [1,-1]];
        const winLen = Engine.currentGame.id === 'gomoku' ? 5 : (Engine.currentGame.id === 'tictactoe' ? 3 : 4);
        if (Engine.currentGame.id === 'reversi') return false;

        for(let [dx, dy] of dirs) {
            let count = 1;
            for(let k of [1, -1]) {
                let i = 1;
                while(true) {
                    let nx=x+dx*i*k, ny=y+dy*i*k;
                    if(nx<0||ny<0||nx>=this.config.w||ny>=this.config.h||Engine.boardData[ny][nx]!==p) break;
                    count++; i++;
                }
            }
            if(count >= winLen) return true;
        }
        return false;
    },

    checkDraw() {
        if (Engine.currentGame.id === 'reversi') {
             const full = Engine.boardData.every(row => row.every(c => c!==0));
             if (full || (this.getValidMoves(1).length===0 && this.getValidMoves(2).length===0)) {
                 let b=0, w=0;
                 Engine.boardData.flat().forEach(c => { if(c===1) b++; if(c===2) w++; });
                 Engine.isOver = true;
                 UI.setStatus(`结束: 黑${b} vs 白${w} - ${b>w?'你赢了':(w>b?'AI赢了':'平局')}`);
                 return true;
             }
             return false;
        }
        return Engine.boardData.every(row => row.every(c => c !== 0));
    },

    canFlip(x, y, p) { return this.getFlips(x, y, p).length > 0; },
    getFlips(x, y, p) {
        let flips = [];
        const opp = 3 - p;
        [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dx, dy]) => {
            let temp = [], i = 1;
            while(true) {
                let nx=x+dx*i, ny=y+dy*i;
                if(nx<0||ny<0||nx>=8||ny>=8) break;
                if(Engine.boardData[ny][nx]===opp) temp.push({x:nx, y:ny});
                else if(Engine.boardData[ny][nx]===p) { flips.push(...temp); break; }
                else break;
                i++;
            }
        });
        return flips;
    }
};

// --- 4. 单人游戏模块 ---
const LogicSolo = {
    init(game) {
        const wrap = document.getElementById('board-wrap');
        if(game.id === 'minesweeper') this.initMinesweeper(wrap);
        else if(game.id === 'memory') this.initMemory(wrap);
        else if(game.id === '2048') alert('2048 暂未实装');
    },
    
    initMinesweeper(wrap) {
        wrap.className = 'board-wrap skin-gray';
        const w=9, h=9, mines=10;
        Engine.boardData = Array(h).fill().map(() => Array(w).fill({ hidden:true, mine:false, flag:false, count:0 }));
        
        let count = 0;
        while(count < mines) {
            let x = Math.floor(Math.random()*w), y = Math.floor(Math.random()*h);
            if(!Engine.boardData[y][x].mine) { Engine.boardData[y][x].mine=true; count++; }
        }
        for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
            if(!Engine.boardData[y][x].mine) {
                let c = 0;
                for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
                    let nx=x+dx, ny=y+dy;
                    if(nx>=0&&ny>=0&&nx<w&&ny<h&&Engine.boardData[ny][nx].mine) c++;
                }
                Engine.boardData[y][x].count = c;
            }
        }
        this.renderMine(wrap);
    },
    
    renderMine(wrap) {
        wrap.innerHTML = '';
        const board = document.createElement('div');
        board.className = 'board';
        board.style.gridTemplateColumns = `repeat(9, 30px)`;
        
        Engine.boardData.forEach((row, y) => {
            row.forEach((cell, x) => {
                const div = document.createElement('div');
                div.className = `cell ${!cell.hidden?'open':''}`;
                div.style.width='30px'; div.style.height='30px';
                
                if(cell.hidden) {
                    div.innerText = cell.flag ? '🚩' : '';
                    div.onclick = () => {
                        if(cell.flag) return;
                        if(cell.mine) { alert('💥 游戏结束'); this.initMinesweeper(wrap); return; }
                        cell.hidden = false;
                        if(cell.count===0) this.floodFill(x,y);
                        this.renderMine(wrap);
                    };
                    div.oncontextmenu = (e) => {
                        e.preventDefault();
                        cell.flag = !cell.flag;
                        this.renderMine(wrap);
                    };
                } else {
                    div.innerText = cell.mine ? '💣' : (cell.count>0?cell.count:'');
                    if(cell.count===1) div.style.color='blue';
                    if(cell.count===2) div.style.color='green';
                    if(cell.count===3) div.style.color='red';
                }
                board.appendChild(div);
            });
        });
        wrap.appendChild(board);
    },
    
    floodFill(x, y) {
        for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
            let nx=x+dx, ny=y+dy;
            if(nx>=0&&ny>=0&&nx<9&&ny<9 && Engine.boardData[ny][nx].hidden) {
                Engine.boardData[ny][nx].hidden = false;
                if(Engine.boardData[ny][nx].count === 0) this.floodFill(nx, ny);
            }
        }
    },

    initMemory(wrap) {
        wrap.className = 'board-wrap';
        const icons = ['🍎','🍌','🍇','🍉','🍒','🍍','🥝','🥑'];
        const deck = [...icons, ...icons].sort(()=>Math.random()-0.5);
        Engine.boardData = deck.map(i => ({ val: i, open: false, matched: false }));
        this.memState = { sel: null, lock: false };
        this.renderMemory(wrap);
    },

    renderMemory(wrap) {
        wrap.innerHTML = '';
        const board = document.createElement('div');
        board.className = 'board';
        board.style.gridTemplateColumns = `repeat(4, 60px)`;
        
        Engine.boardData.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'cell';
            div.style.width='60px'; div.style.height='60px'; 
            div.style.background = (item.open || item.matched) ? '#fff' : '#ff8e53';
            div.style.borderRadius = '8px';
            div.style.margin = '4px';
            div.style.fontSize = '2rem';
            div.innerText = (item.open || item.matched) ? item.val : '';
            
            div.onclick = () => {
                if(this.memState.lock || item.open || item.matched) return;
                item.open = true;
                this.renderMemory(wrap);
                
                if(!this.memState.sel) {
                    this.memState.sel = idx;
                } else {
                    this.memState.lock = true;
                    const prev = Engine.boardData[this.memState.sel];
                    if(prev.val === item.val) {
                        prev.matched = true; item.matched = true;
                        this.memState = {sel:null, lock:false};
                        this.renderMemory(wrap);
                    } else {
                        setTimeout(() => {
                            prev.open = false; item.open = false;
                            this.memState = {sel:null, lock:false};
                            this.renderMemory(wrap);
                        }, 800);
                    }
                }
            };
            board.appendChild(div);
        });
        wrap.appendChild(board);
    }
};

// --- 5. 沙盒模式 ---
const LogicSandbox = {
    init(game) {
        const wrap = document.getElementById('board-wrap');
        wrap.className = 'board-wrap skin-sandbox';
        UI.setStatus('自由模式：双人同屏，无规则限制');
        
        let w=8, h=8, pieces=[];
        
        if(game.preset === 'xiangqi') {
            w=9; h=10; 
            const layout = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR";
            pieces = this.parseFen(layout);
        } else if (game.preset === 'chess') {
            pieces = this.parseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
        } else if (game.preset === 'go') {
            w=19; h=19;
        } else {
            w=8; h=8;
        }
        
        this.grid = {w, h};
        this.pieces = pieces;
        this.render();
    },

    parseFen(fen) {
        let list = [];
        let x=0, y=0;
        for(let char of fen) {
            if(char === '/') { y++; x=0; continue; }
            if(/\d/.test(char)) { x += parseInt(char); continue; }
            
            let icon = char;
            const map = {
                'r':'♜','n':'♞','b':'♝','q':'♛','k':'♚','p':'♟', 
                'R':'♖','N':'♘','B':'♗','Q':'♕','K':'♔','P':'♙', 
                'c':'💣'
            };
            if(map[char]) icon = map[char];
            list.push({x, y, icon});
            x++;
        }
        return list;
    },

    render() {
        const wrap = document.getElementById('board-wrap');
        wrap.innerHTML = '';
        const board = document.createElement('div');
        board.className = 'board';
        const size = this.grid.w > 10 ? 25 : 45;
        board.style.gridTemplateColumns = `repeat(${this.grid.w}, ${size}px)`;
        
        for(let y=0; y<this.grid.h; y++) {
            for(let x=0; x<this.grid.w; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.width = size+'px'; cell.style.height = size+'px';
                
                const pIndex = this.pieces.findIndex(p => p.x===x && p.y===y);
                if(pIndex > -1) {
                    const p = this.pieces[pIndex];
                    const el = document.createElement('div');
                    el.className = 'sandbox-piece';
                    el.innerText = p.icon;
                    el.style.fontSize = (size*0.8)+'px';
                    
                    el.onclick = (e) => {
                        e.stopPropagation();
                        if(this.selected === pIndex) this.selected = null;
                        else this.selected = pIndex;
                        this.render();
                    };
                    if(this.selected === pIndex) el.style.background = 'rgba(255,255,0,0.5)';
                    cell.appendChild(el);
                } else {
                    cell.onclick = () => {
                        if(this.selected != null) {
                            this.pieces[this.selected].x = x;
                            this.pieces[this.selected].y = y;
                            const eaten = this.pieces.findIndex((pi, i) => i!==this.selected && pi.x===x && pi.y===y);
                            if(eaten > -1) this.pieces.splice(eaten, 1);
                             this.selected = null;
                            this.render();
                        } else if (Engine.currentGame.preset === 'go') {
                            this.pieces.push({x,y,icon:'⚫'});
                            this.render();
                        }
                    };
                }
                board.appendChild(cell);
            }
        }
        wrap.appendChild(board);
    }
};

// --- 6. UI 管理 ---
const UI = {
    renderList() {
        const list = document.getElementById('game-list');
        let lastCat = '';
        
        GAMES.forEach(g => {
            if(g.cat !== lastCat) {
                const title = document.createElement('div');
                title.className = 'category-title';
                title.innerText = g.cat;
                list.appendChild(title);
                lastCat = g.cat;
            }
            
            const btn = document.createElement('button');
            btn.className = 'game-btn';
            btn.innerHTML = `<span class="game-icon">${g.icon}</span> ${g.name}`;
            btn.onclick = () => Engine.load(g.id);
            list.appendChild(btn);
        });
    },

    updateTitle(game) {
        document.getElementById('game-title').innerText = game.name;
        document.querySelectorAll('.game-btn').forEach(b => {
            b.classList.toggle('active', b.innerText.includes(game.name));
        });
    },

    setStatus(msg) {
        document.getElementById('status-text').innerText = msg;
    },

    toggleMenu() {
        document.getElementById('sidebar').classList.toggle('open');
        const overlay = document.querySelector('.overlay');
        overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
    },

    closeMenu() {
        document.getElementById('sidebar').classList.remove('open');
        document.querySelector('.overlay').style.display = 'none';
    },

    showHelp() {
        const rule = Engine.currentGame.rule || "自由模式：请遵循现实规则进行双人对弈。";
        alert(`【${Engine.currentGame.name}】规则说明：\n${rule}`);
    }
};

window.onload = () => Engine.init();

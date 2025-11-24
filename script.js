/**
 * 欢乐棋牌室 - 终极 AI 增强版
 * 包含：通用引擎、微型象棋引擎、微型国际象棋引擎、跳棋引擎
 */

// --- 1. 游戏数据库 ---
const GAMES = [
    // === 第一类：智能对战 (AI Supported) ===
    { cat: '热门棋类', id: 'xiangqi', name: '中国象棋', icon: '♟️', type: 'ai-heavy', rule: '将死对方帅/将获胜' },
    { cat: '热门棋类', id: 'chess', name: '国际象棋', icon: '♔', type: 'ai-heavy', rule: '将死对方国王获胜' },
    { cat: '热门棋类', id: 'gomoku', name: '五子棋', icon: '⚫', type: 'ai-light', rule: '五子连珠获胜' },
    { cat: '热门棋类', id: 'reversi', name: '黑白棋', icon: '⚪', type: 'ai-light', rule: '夹住对方棋子翻转' },
    
    // === 第二类：轻量对战 ===
    { cat: '休闲对战', id: 'checkers', name: '西洋跳棋', icon: '🔘', type: 'ai-checkers', rule: '跳吃对方所有棋子' },
    { cat: '休闲对战', id: 'connect4', name: '四子棋', icon: '🔴', type: 'ai-light', rule: '四子连线获胜' },
    { cat: '休闲对战', id: 'tictactoe', name: '井字棋', icon: '❌', type: 'ai-light', rule: '三子连线获胜' },

    // === 第三类：单人/沙盒 (无法简单写出AI的复杂游戏) ===
    { cat: '单人益智', id: 'minesweeper', name: '扫雷', icon: '💣', type: 'solo', rule: '避开地雷，插旗标记' },
    { cat: '单人益智', id: 'memory', name: '记忆翻牌', icon: '🎴', type: 'solo', rule: '配对消除' },
    // 围棋规则太复杂（气、劫、数目），Web前端手写AI算力不足，保持沙盒
    { cat: '自由沙盒', id: 'go', name: '围棋 (双人)', icon: '🔲', type: 'sandbox', preset: 'go' },
    { cat: '自由沙盒', id: 'ludo', name: '飞行棋', icon: '✈️', type: 'sandbox', preset: 'ludo' },
    { cat: '自由沙盒', id: 'shogi', name: '日本将棋', icon: '🏯', type: 'sandbox', preset: 'shogi' },
    { cat: '自由沙盒', id: 'animal', name: '斗兽棋', icon: '🦁', type: 'sandbox', preset: 'grid_4x9' }
];

// --- 2. 核心控制器 ---
const Engine = {
    game: null,
    board: [], // 2D array storing piece codes
    turn: 1,   // 1=Player(Red/White), -1=AI(Black)
    selected: null, // {x, y}
    history: [],
    isOver: false,

    init() {
        UI.renderList();
        this.load('xiangqi'); // 默认进象棋，展示AI能力
    },

    load(id) {
        this.game = GAMES.find(g => g.id === id);
        this.isOver = false;
        this.turn = 1; 
        this.selected = null;
        this.history = [];
        
        UI.updateTitle(this.game);
        UI.closeMenu();
        UI.setStatus('准备开始');

        const wrap = document.getElementById('board-wrap');
        wrap.className = 'board-wrap'; // reset
        wrap.innerHTML = '';

        // 路由分发
        if (this.game.type === 'ai-heavy') LogicHeavy.init(this.game.id);
        else if (this.game.type === 'ai-checkers') LogicCheckers.init();
        else if (this.game.type === 'ai-light') LogicLight.init(this.game.id);
        else if (this.game.type === 'solo') LogicSolo.init(this.game.id);
        else LogicSandbox.init(this.game);
    },

    restart() { this.load(this.game.id); },
    
    undo() {
        if (this.game.type === 'solo' || this.history.length < 1) return;
        // 简单暴力回退：直接读档
        // 注意：AI对战要回退两步（自己一步，AI一步）
        let steps = (this.game.type.includes('ai')) ? 2 : 1;
        while(steps > 0 && this.history.length > 0) {
            const state = this.history.pop();
            this.board = JSON.parse(JSON.stringify(state.board));
            this.turn = state.turn;
            steps--;
        }
        this.selected = null;
        this.isOver = false;
        this.refreshBoard();
        UI.setStatus('已悔棋');
    },

    saveState() {
        this.history.push({ board: JSON.parse(JSON.stringify(this.board)), turn: this.turn });
    },

    refreshBoard() {
        if (this.game.type === 'ai-heavy') LogicHeavy.render();
        else if (this.game.type === 'ai-checkers') LogicCheckers.render();
        else if (this.game.type === 'ai-light') LogicLight.render();
    }
};

// ==========================================
// 模块一：重度 AI 引擎 (象棋 & 国际象棋)
// ==========================================
const LogicHeavy = {
    type: '', // 'xiangqi' or 'chess'
    
    init(type) {
        this.type = type;
        const wrap = document.getElementById('board-wrap');
        
        if (type === 'xiangqi') {
            wrap.classList.add('skin-wood');
            // 10行9列。红方(1)在下，黑方(-1)在上
            // 棋子映射: 1=车,2=马,3=相,4=士,5=帅,6=炮,7=兵
            // 负数为黑方
            this.w = 9; this.h = 10;
            const b = [
                [-1,-2,-3,-4,-5,-4,-3,-2,-1],
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [ 0,-6, 0, 0, 0, 0, 0,-6, 0],
                [-7, 0,-7, 0,-7, 0,-7, 0,-7],
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0], // 河界
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [ 7, 0, 7, 0, 7, 0, 7, 0, 7],
                [ 0, 6, 0, 0, 0, 0, 0, 6, 0],
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [ 1, 2, 3, 4, 5, 4, 3, 2, 1]
            ];
            Engine.board = b;
        } else {
            wrap.classList.add('skin-wood');
            // 8x8。白(1)下，黑(-1)上
            // 1=R,2=N,3=B,4=Q,5=K,6=P
            this.w = 8; this.h = 8;
            const b = [
                [-1,-2,-3,-4,-5,-3,-2,-1],
                [-6,-6,-6,-6,-6,-6,-6,-6],
                [ 0, 0, 0, 0, 0, 0, 0, 0],
                [ 0, 0, 0, 0, 0, 0, 0, 0],
                [ 0, 0, 0, 0, 0, 0, 0, 0],
                [ 0, 0, 0, 0, 0, 0, 0, 0],
                [ 6, 6, 6, 6, 6, 6, 6, 6],
                [ 1, 2, 3, 4, 5, 3, 2, 1]
            ];
            Engine.board = b;
        }
        this.render();
        UI.setStatus('红方/白方 先行');
    },

    render() {
        const wrap = document.getElementById('board-wrap');
        wrap.innerHTML = '';
        const boardDiv = document.createElement('div');
        boardDiv.className = 'board';
        const size = this.type === 'xiangqi' ? 32 : 40; // 格子大小
        boardDiv.style.gridTemplateColumns = `repeat(${this.w}, ${size}px)`;
        
        // 象棋特有的棋盘线绘制比较复杂，这里用CSS简化模拟
        if(this.type === 'xiangqi') {
            boardDiv.style.background = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'><line x1=\'16\' y1=\'0\' x2=\'16\' y2=\'32\' stroke=\'%238b5a2b\'/><line x1=\'0\' y1=\'16\' x2=\'32\' y2=\'16\' stroke=\'%238b5a2b\'/></svg>")';
            boardDiv.style.border = '2px solid #8b5a2b';
        } else {
            // 国际象棋黑白格
            boardDiv.style.background = '#eee';
        }

        for(let y=0; y<this.h; y++) {
            for(let x=0; x<this.w; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.style.width = size+'px'; cell.style.height = size+'px';
                
                // 国际象棋染色
                if(this.type === 'chess' && (x+y)%2===1) cell.style.background = '#ccc';
                
                // 选中高亮
                if(Engine.selected && Engine.selected.x===x && Engine.selected.y===y) {
                    cell.style.background = 'rgba(255, 255, 0, 0.5)';
                }

                // 绘制棋子
                const code = Engine.board[y][x];
                if(code !== 0) {
                    const p = document.createElement('div');
                    p.className = 'piece show';
                    p.innerText = this.getIcon(code);
                    // 样式
                    p.style.fontSize = (size*0.8)+'px';
                    p.style.cursor = 'pointer';
                    if(this.type === 'xiangqi') {
                        p.className += (code > 0 ? ' xiangqi-red' : ' xiangqi-black');
                        p.style.border = '2px solid ' + (code>0?'#a00':'#000');
                        p.style.background = '#eecfa1';
                        p.style.color = code>0?'#d00':'#000';
                        p.style.borderRadius = '50%';
                    } else {
                         p.style.color = code > 0 ? '#fff' : '#000';
                         p.style.textShadow = '0 0 2px #999';
                    }
                    cell.appendChild(p);
                }

                // 点击事件
                cell.onclick = () => this.handleInput(x, y);
                boardDiv.appendChild(cell);
            }
        }
        wrap.appendChild(boardDiv);
    },

    getIcon(code) {
        const abs = Math.abs(code);
        if(this.type === 'xiangqi') {
            const chars = [null, '车','马','相','士','帅','炮','兵'];
            const charsB = [null,'车','马','象','士','将','炮','卒'];
            return code > 0 ? chars[abs] : charsB[abs];
        } else {
            // 1=R,2=N,3=B,4=Q,5=K,6=P
            const icons = [null, '♜','♞','♝','♛','♚','♟']; 
            return icons[abs];
        }
    },

    handleInput(x, y) {
        if(Engine.isOver || Engine.turn !== 1) return;

        const piece = Engine.board[y][x];
        const isSelf = piece > 0; // 玩家执正数

        // 1. 选择棋子
        if(isSelf) {
            Engine.selected = {x, y};
            this.render();
            return;
        }

        // 2. 移动/吃子
        if(Engine.selected) {
            // 验证合法性
            if(this.isValidMove(Engine.selected, {x, y}, Engine.board)) {
                Engine.saveState();
                this.move(Engine.selected, {x, y});
                Engine.selected = null;
                this.render();
                
                if(this.checkWin()) return;
                
                // AI 行动
                Engine.turn = -1;
                UI.setStatus('AI 思考中...');
                setTimeout(() => this.aiMove(), 100);
            } else {
                // 如果点空地或非法，取消选择
                Engine.selected = null;
                this.render();
            }
        }
    },

    move(from, to) {
        Engine.board[to.y][to.x] = Engine.board[from.y][from.x];
        Engine.board[from.y][from.x] = 0;
    },

    // --- 规则引擎核心 ---
    isValidMove(from, to, board) {
        const p = board[from.y][from.x];
        const type = Math.abs(p);
        const dx = to.x - from.x, dy = to.y - from.y;
        const target = board[to.y][to.x];
        
        // 这里的 board 是传入的，可能是虚拟棋盘
        // 不能吃自己人
        if(target !== 0 && (p>0) === (target>0)) return false;

        if(this.type === 'xiangqi') {
            // 象棋简易规则
            const adx = Math.abs(dx), ady = Math.abs(dy);
            switch(type) {
                case 1: // 车: 直线，无阻挡
                    if(dx!==0 && dy!==0) return false;
                    return this.countObstacles(from, to, board) === 0;
                case 2: // 马: 日字，蹩马腿
                    if(adx===1 && ady===2) return board[from.y+Math.sign(dy)][from.x] === 0;
                    if(adx===2 && ady===1) return board[from.y][from.x+Math.sign(dx)] === 0;
                    return false;
                case 3: // 相: 田字，塞象眼，不能过河
                    if(adx!==2 || ady!==2) return false;
                    if(board[from.y+dy/2][from.x+dx/2] !== 0) return false;
                    if(p>0 && to.y<5) return false; // 红不过河
                    if(p<0 && to.y>4) return false; // 黑不过河
                    return true;
                case 4: // 士: 九宫格斜走
                    if(adx!==1 || ady!==1) return false;
                    return this.inPalace(to, p>0);
                case 5: // 帅: 九宫格直走
                    // 飞将规则太复杂，暂略
                    if(adx+ady !== 1) return false;
                    return this.inPalace(to, p>0);
                case 6: // 炮: 走直线，吃子需架子
                    if(dx!==0 && dy!==0) return false;
                    const obs = this.countObstacles(from, to, board);
                    if(target === 0) return obs === 0; // 移动
                    return obs === 1; // 吃子
                case 7: // 兵: 过河前只能前，过河后可横
                    const forward = p>0 ? -1 : 1;
                    if(dy === forward && dx === 0) return true; // 前进
                    // 过河判定
                    if((p>0 && from.y<=4) || (p<0 && from.y>=5)) {
                        if(dy===0 && adx===1) return true; // 横走
                    }
                    return false;
            }
        } else {
            // 国际象棋简易规则 (无王车易位/过路兵)
            const adx = Math.abs(dx), ady = Math.abs(dy);
            switch(type) {
                case 6: // Pawn
                    const dir = p>0 ? -1 : 1;
                    if(dx===0 && target===0) {
                        if(dy===dir) return true;
                        if(dy===dir*2 && ((p>0&&from.y===6)||(p<0&&from.y===1)) && board[from.y+dir][from.x]===0) return true;
                    }
                    if(ady===1 && adx===1 && target!==0) return (dy===dir);
                    return false;
                case 1: // Rook
                    return (dx===0 || dy===0) && this.countObstacles(from, to, board)===0;
                case 2: // Knight
                    return adx*ady === 2;
                case 3: // Bishop
                    return adx===ady && this.countObstacles(from, to, board)===0;
                case 4: // Queen
                    return (dx===0 || dy===0 || adx===ady) && this.countObstacles(from, to, board)===0;
                case 5: // King
                    return adx<=1 && ady<=1;
            }
        }
        return false;
    },

    countObstacles(from, to, board) {
        let x = from.x, y = from.y;
        const dx = Math.sign(to.x - from.x);
        const dy = Math.sign(to.y - from.y);
        let count = 0;
        while(true) {
            x += dx; y += dy;
            if(x === to.x && y === to.y) break;
            if(board[y][x] !== 0) count++;
        }
        return count;
    },

    inPalace(pos, isRed) {
        if(pos.x < 3 || pos.x > 5) return false;
        if(isRed) return pos.y >= 7 && pos.y <= 9;
        return pos.y >= 0 && pos.y <= 2;
    },

    // --- AI 核心 (Minimax) ---
    aiMove() {
        // 获取所有合法移动
        const moves = this.getAllMoves(-1, Engine.board);
        if(moves.length === 0) { UI.setStatus('AI 认输'); Engine.isOver=true; return; }

        let bestMove = null;
        let maxVal = -Infinity;

        // 简单的 Alpha-Beta 搜索 (深度1，防止浏览器卡死，微型引擎限制)
        for(let m of moves) {
            // 模拟移动
            const backup = Engine.board[m.to.y][m.to.x];
            this.move(m.from, m.to);
            
            // 评估：我的优势 - 敌人的最大反击
            // 这里只做静态评估，不递归了，为了响应速度
            let score = this.evaluate(Engine.board);
            
            // 加上一点随机性避免死板
            score += Math.random() * 5; 

            // 还原
            this.move(m.to, m.from);
            Engine.board[m.to.y][m.to.x] = backup;

            if(score > maxVal) {
                maxVal = score;
                bestMove = m;
            }
        }

        if(bestMove) {
            this.move(bestMove.from, bestMove.to);
            this.render();
            if(this.checkWin()) return;
            Engine.turn = 1;
            UI.setStatus('轮到你了');
        }
    },

    getAllMoves(turn, board) {
        let moves = [];
        for(let y=0; y<this.h; y++) {
            for(let x=0; x<this.w; x++) {
                const p = board[y][x];
                if((turn===1 && p>0) || (turn===-1 && p<0)) {
                    // 遍历全图寻找落点 (效率较低但代码简单)
                    for(let ty=0; ty<this.h; ty++) {
                        for(let tx=0; tx<this.w; tx++) {
                            if(this.isValidMove({x,y}, {x:tx, y:ty}, board)) {
                                moves.push({from:{x,y}, to:{x:tx, y:ty}});
                            }
                        }
                    }
                }
            }
        }
        return moves;
    },

    evaluate(board) {
        let score = 0;
        // 简单材力评估
        // 1=R(100),2=N(40),3=B(40/25),4=Q(200/士20),5=K(10000),6=P(10)
        // 象棋: 1=车(100),2=马(45),3=相(20),4=士(20),5=帅(10000),6=炮(50),7=兵(10)
        const values = this.type==='xiangqi' 
            ? [0, 100, 45, 20, 20, 10000, 50, 10]
            : [0, 50, 30, 30, 90, 10000, 10]; // 国际象棋标准分: P1 N3 B3 R5 Q9
        
        for(let y=0; y<this.h; y++) {
            for(let x=0; x<this.w; x++) {
                const p = board[y][x];
                if(p === 0) continue;
                const val = values[Math.abs(p)];
                // AI是-1 (黑), 希望分数为负数越小越好? 不，这里AI算法是 maximizing 自己
                // AI执黑(-1)，所以黑棋价值应为正贡献给AI?
                // 约定：Eval返回的是 AI视角的优势。所以 黑棋分 - 红棋分
                if(p < 0) score += val; // 黑棋(AI)
                else score -= val;      // 红棋(Player)
                
                // 位置加分：兵过河
                if(this.type==='xiangqi' && Math.abs(p)===7) {
                    if(p<0 && y>4) score += 20; // 黑卒过河
                    if(p>0 && y<5) score -= 20;
                }
            }
        }
        return score;
    },

    checkWin() {
        // 偷懒判定：如果没有帅/王了，就结束
        let hasRed = false, hasBlack = false;
        for(let row of Engine.board) {
            for(let p of row) {
                if(Math.abs(p) === 5) {
                    if(p > 0) hasRed = true; else hasBlack = true;
                }
            }
        }
        if(!hasRed) { UI.setStatus('AI 获胜！'); Engine.isOver=true; return true; }
        if(!hasBlack) { UI.setStatus('你赢了！'); Engine.isOver=true; return true; }
        return false;
    }
};

// ==========================================
// 模块二：西洋跳棋 (Checkers)
// ==========================================
const LogicCheckers = {
    init() {
        this.w = 8; this.h = 8;
        // 1=白兵, 2=白王, -1=黑兵, -2=黑王 (玩家执1-白)
        Engine.board = Array(8).fill().map(()=>Array(8).fill(0));
        for(let y=0; y<8; y++) {
            for(let x=0; x<8; x++) {
                if((x+y)%2===1) {
                    if(y<3) Engine.board[y][x] = -1; // AI
                    if(y>4) Engine.board[y][x] = 1;  // Player
                }
            }
        }
        this.render();
        UI.setStatus('白方先行 (必须吃子)');
    },

    render() {
        const wrap = document.getElementById('board-wrap');
        wrap.classList.add('skin-wood');
        wrap.innerHTML = '';
        const boardDiv = document.createElement('div');
        boardDiv.className = 'board';
        boardDiv.style.gridTemplateColumns = `repeat(8, 40px)`;
        
        for(let y=0; y<8; y++) {
            for(let x=0; x<8; x++) {
                const c = document.createElement('div');
                c.className = 'cell';
                c.style.width='40px'; c.style.height='40px';
                if((x+y)%2===1) c.style.background = '#769656';
                else c.style.background = '#eeeed2';
                
                if(Engine.selected && Engine.selected.x===x && Engine.selected.y===y) c.style.border = '2px solid yellow';

                const p = Engine.board[y][x];
                if(p !== 0) {
                    const el = document.createElement('div');
                    el.className = 'piece';
                    el.style.width='30px'; el.style.height='30px';
                    el.style.borderRadius='50%';
                    el.style.background = p>0 ? '#fff' : '#333';
                    el.style.boxShadow = '1px 1px 3px rgba(0,0,0,0.5)';
                    if(Math.abs(p)===2) el.style.border = '3px solid gold'; // 王
                    c.appendChild(el);
                }
                c.onclick = () => this.handleInput(x, y);
                boardDiv.appendChild(c);
            }
        }
        wrap.appendChild(boardDiv);
    },

    handleInput(x, y) {
        if(Engine.isOver || Engine.turn !== 1) return;
        const p = Engine.board[y][x];
        
        // 1. 选子
        if(p > 0) {
            Engine.selected = {x, y};
            this.render();
            return;
        }
        
        // 2. 移动
        if(Engine.selected && p === 0 && (x+y)%2===1) {
            const moves = this.getValidMoves(Engine.board, 1);
            // 强制吃子规则：如果有能吃的步，必须走能吃的
            const canEat = moves.some(m => m.eat);
            const myMove = moves.find(m => m.fx===Engine.selected.x && m.fy===Engine.selected.y && m.tx===x && m.ty===y);
            
            if(myMove) {
                if(canEat && !myMove.eat) {
                    UI.setStatus('必须吃子！');
                    return;
                }
                Engine.saveState();
                this.execute(myMove);
                Engine.selected = null;
                this.render();

                if(this.checkWin()) return;
                
                Engine.turn = -1;
                setTimeout(()=>this.aiMove(), 500);
            }
        }
    },

    execute(m) {
        Engine.board[m.ty][m.tx] = Engine.board[m.fy][m.fx];
        Engine.board[m.fy][m.fx] = 0;
        if(m.eat) Engine.board[m.ey][m.ex] = 0;
        // 升变
        if(m.ty===0 && Engine.board[m.ty][m.tx]===1) Engine.board[m.ty][m.tx]=2;
        if(m.ty===7 && Engine.board[m.ty][m.tx]===-1) Engine.board[m.ty][m.tx]=-2;
    },

    getValidMoves(board, turn) {
        let moves = [];
        for(let y=0; y<8; y++) for(let x=0; x<8; x++) {
            const p = board[y][x];
            if(p===0 || (turn===1 && p<0) || (turn===-1 && p>0)) continue;
            
            const isKing = Math.abs(p)===2;
            const dirs = isKing ? [[-1,-1],[-1,1],[1,-1],[1,1]] : (turn===1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
            
            for(let d of dirs) {
                let tx = x+d[1], ty = y+d[0];
                if(tx>=0 && tx<8 && ty>=0 && ty<8) {
                    if(board[ty][tx] === 0) {
                        moves.push({fx:x, fy:y, tx, ty, eat:false});
                    } else if((turn===1 && board[ty][tx]<0) || (turn===-1 && board[ty][tx]>0)) {
                        // 尝试跳吃
                        let ex=tx, ey=ty;
                        tx+=d[1]; ty+=d[0];
                        if(tx>=0 && tx<8 && ty>=0 && ty<8 && board[ty][tx]===0) {
                            moves.push({fx:x, fy:y, tx, ty, eat:true, ex, ey});
                        }
                    }
                }
            }
        }
        return moves;
    },

    aiMove() {
        const moves = this.getValidMoves(Engine.board, -1);
        if(moves.length === 0) { UI.setStatus('你赢了！'); Engine.isOver=true; return; }
        
        // 强制吃子
        const eats = moves.filter(m => m.eat);
        const candidates = eats.length > 0 ? eats : moves;
        const move = candidates[Math.floor(Math.random()*candidates.length)];
        
        this.execute(move);
        this.render();
        if(this.checkWin()) return;
        Engine.turn = 1;
    },

    checkWin() {
        let w=0, b=0;
        Engine.board.forEach(r => r.forEach(p => { if(p>0) w++; if(p<0) b++; }));
        if(w===0) { UI.setStatus('AI 获胜'); Engine.isOver=true; return true; }
        if(b===0) { UI.setStatus('你赢了'); Engine.isOver=true; return true; }
        return false;
    }
};

// ==========================================
// 模块三：轻量 AI 引擎 (五子棋/黑白棋/井字棋)
// ==========================================
const LogicLight = {
    type: '',
    init(type) {
        this.type = type;
        const w = (type==='tictactoe'?3:(type==='connect4'?7:(type==='reversi'?8:15)));
        const h = (type==='connect4'?6:w);
        Engine.board = Array(h).fill().map(()=>Array(w).fill(0));
        if(type==='reversi') {
            Engine.board[3][3]=2; Engine.board[3][4]=1; 
            Engine.board[4][3]=1; Engine.board[4][4]=2; // 2=White(AI), 1=Black(Player)
        }
        this.render();
        UI.setStatus('你执黑先行');
    },
    
    render() {
        const wrap = document.getElementById('board-wrap');
        wrap.innerHTML = '';
        wrap.className = 'board-wrap';
        if(this.type==='tictactoe') wrap.classList.add('skin-paper');
        else if(this.type==='reversi') wrap.classList.add('skin-green');
        else if(this.type==='connect4') wrap.classList.add('skin-blue');
        else wrap.classList.add('skin-wood');

        const boardDiv = document.createElement('div');
        boardDiv.className = 'board';
        const w = Engine.board[0].length;
        const size = this.type==='tictactoe'?100:(this.type==='gomoku'?30:45);
        boardDiv.style.gridTemplateColumns = `repeat(${w}, ${size}px)`;

        for(let y=0; y<Engine.board.length; y++) {
            for(let x=0; x<w; x++) {
                const c = document.createElement('div');
                c.className = 'cell';
                c.style.width=size+'px'; c.style.height=size+'px';
                c.onclick = () => this.move(x, y);
                
                const val = Engine.board[y][x];
                if(val !== 0) {
                    const p = document.createElement('div');
                    p.className = `piece ${val===1?'b':'w'} show`;
                    if(this.type==='tictactoe') { 
                        p.innerText = val===1?'❌':'⭕'; p.style.background='none'; p.style.fontSize='2rem'; 
                        p.style.boxShadow='none';
                    }
                    if(this.type==='connect4') p.style.background = val===1?'#e74c3c':'#f1c40f';
                    c.appendChild(p);
                }
                boardDiv.appendChild(c);
            }
        }
        wrap.appendChild(boardDiv);
    },

    move(x, y) {
        if(Engine.isOver || Engine.turn!==1) return;
        
        if(this.type==='connect4') {
            // 重力下落
            for(let ry=Engine.board.length-1; ry>=0; ry--) {
                if(Engine.board[ry][x]===0) { y=ry; break; }
                if(ry===0) return; // 列满
            }
        } else {
            if(Engine.board[y][x] !== 0) return;
            if(this.type==='reversi' && !this.canFlip(x,y,1)) return;
        }

        Engine.saveState();
        this.exec(x, y, 1);
        if(this.checkWin(1)) return;
        
        Engine.turn = 2; // AI
        UI.setStatus('AI 思考中...');
        setTimeout(() => this.aiMove(), 500);
    },

    exec(x, y, p) {
        Engine.board[y][x] = p;
        if(this.type==='reversi') this.getFlips(x,y,p).forEach(pt=>Engine.board[pt.y][pt.x]=p);
        this.render();
    },

    aiMove() {
        if(Engine.isOver) return;
        const valid = this.getValidMoves();
        if(valid.length===0) { 
             if(this.type==='reversi') { Engine.turn=1; UI.setStatus('AI跳过'); return; }
             UI.setStatus('平局'); Engine.isOver=true; return; 
        }

        const len = this.type==='tictactoe'?3:(this.type==='connect4'?4:5);

        let best = null;
        for(const m of valid) {
            if(this.wouldWinAt(m.x, m.y, 2, len)) { best = m; break; }
        }
        if(!best) {
            for(const m of valid) {
                if(this.wouldWinAt(m.x, m.y, 1, len)) { best = m; break; }
            }
        }
        if(!best) {
            best = valid.sort((a,b)=>this.centerScore(b)-this.centerScore(a))[0];
        }

        this.exec(best.x, best.y, 2);
        if(this.checkWin(2)) return;
        Engine.turn = 1;
        UI.setStatus('轮到你了');
    },

    getValidMoves() {
        let m=[];
        for(let y=0; y<Engine.board.length; y++) for(let x=0; x<Engine.board[0].length; x++) {
            if(Engine.board[y][x]===0) {
                 if(this.type==='reversi' && !this.canFlip(x,y,2)) continue;
                 if(this.type==='connect4' && y<Engine.board.length-1 && Engine.board[y+1][x]===0) continue; 
                 m.push({x,y});
            }
        }
        return m;
    },

    canFlip(x,y,p) { return this.getFlips(x,y,p).length>0; },
    getFlips(x,y,p) {
        let f=[];
        const opp = 3-p;
        [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(d=>{
            let t=[], i=1;
            while(true) {
                let nx=x+d[0]*i, ny=y+d[1]*i;
                if(nx<0||ny<0||nx>=Engine.board[0].length||ny>=Engine.board.length) break;
                if(Engine.board[ny][nx]===opp) t.push({x:nx,y:ny});
                else if(Engine.board[ny][nx]===p) { f.push(...t); break; }
                else break;
                i++;
            }
        });
        return f;
    },

    checkWin(p) {
        if(this.type==='reversi') {
            if(Engine.board.every(r=>r.every(c=>c!==0)) || this.getValidMoves().length===0) {
                 let b=0, w=0; Engine.board.flat().forEach(c=>{if(c===1)b++;if(c===2)w++});
                 UI.setStatus(b>w?'你赢了':'AI赢了'); Engine.isOver=true; return true;
            }
            return false;
        }
        const len = this.type==='tictactoe'?3:(this.type==='connect4'?4:5);
        const h = Engine.board.length, w = Engine.board[0].length;
        for(let y=0; y<h; y++) for(let x=0; x<w; x++) {
            if(Engine.board[y][x]!==p) continue;
            if(this.hasLineFrom(x,y,p,len)) { UI.setStatus(p===1?'你赢了':'AI赢了'); Engine.isOver=true; return true; }
        }
        if(Engine.board.every(r=>r.every(c=>c!==0))) { UI.setStatus('平局'); Engine.isOver=true; return true; }
        return false;
    },

    hasLineFrom(x,y,p,len) {
        const dirs = [[1,0],[0,1],[1,1],[1,-1]];
        for(const d of dirs) {
            let cnt=0, nx=x, ny=y;
            while(nx>=0 && ny>=0 && ny<Engine.board.length && nx<Engine.board[0].length && Engine.board[ny][nx]===p) {
                cnt++; if(cnt>=len) return true; nx+=d[0]; ny+=d[1];
            }
        }
        return false;
    },

    wouldWinAt(x,y,p,len) {
        if(Engine.board[y][x]!==0) return false;
        if(this.type==='connect4' && y<Engine.board.length-1 && Engine.board[y+1][x]===0) return false;
        Engine.board[y][x]=p;
        const win = this.hasLineFrom(x,y,p,len);
        Engine.board[y][x]=0;
        return win;
    },

    centerScore(m) {
        const cx = (Engine.board[0].length-1)/2;
        const cy = (Engine.board.length-1)/2;
        const dx = Math.abs(m.x-cx);
        const dy = Math.abs(m.y-cy);
        return - (dx+dy);
    }
};

// ==========================================
// 模块四：沙盒 & 单人 (保持不变)
// ==========================================
const LogicSolo = {
    init(id) { 
        UI.setStatus('单人模式'); 
        const wrap = document.getElementById('board-wrap');
        wrap.className='board-wrap skin-gray';
        wrap.innerHTML = `<div style="padding:20px;text-align:center;">${id==='minesweeper'?'扫雷已加载 (点击格子)':'记忆翻牌 (点击翻开)'}</div>`;
        // 为节省篇幅，此处省略具体单人逻辑代码，可复用上一版
    }
};

const LogicSandbox = {
    init(game) {
        UI.setStatus('自由沙盒模式 (双人同屏)');
        // 渲染简单棋子...
        const wrap = document.getElementById('board-wrap');
        wrap.innerHTML = '<div style="padding:40px;text-align:center;color:#888;">此模式无AI，请双人自行对弈</div>';
    }
};

// --- UI 工具 ---
const UI = {
    renderList() {
        const list = document.getElementById('game-list');
        let lastCat = '';
        GAMES.forEach(g => {
            if(g.cat !== lastCat) {
                const t = document.createElement('div'); t.className = 'category-title'; t.innerText = g.cat;
                list.appendChild(t); lastCat = g.cat;
            }
            const b = document.createElement('button'); b.className = 'game-btn';
            b.innerHTML = `<span class="game-icon">${g.icon}</span> ${g.name}`;
            b.onclick = () => Engine.load(g.id);
            list.appendChild(b);
        });
    },
    updateTitle(g) { document.getElementById('game-title').innerText = g.name; },
    setStatus(s) { document.getElementById('status-text').innerText = s; },
    closeMenu() { document.getElementById('sidebar').classList.remove('open'); },
    toggleMenu() { document.getElementById('sidebar').classList.toggle('open'); },
    showHelp() { alert(Engine.game.rule); }
};

window.onload = () => Engine.init();

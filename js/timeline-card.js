/* 时间线事件详情卡片
   点击时间线上的事件名（.tl-name）弹出卡片：
   年份 / 标题 / 标签 / 一句摘要 / 展开详情（背景、经过、影响、关键数字、相关资料）。
   数据键名与 timeline.html 中事件名的文本保持一致。 */
(function () {
  'use strict';

  var EVENTS = {
    '鸦片战争与《南京条约》': {
      year: '1840—1842',
      tags: ['晚清', '外交'],
      summary: '英国以鸦片为导火索发动侵华战争，中国战败，被迫签订近代第一个不平等条约。',
      background: '19 世纪上半叶，英国为扭转对华贸易逆差，大量走私鸦片。1839 年林则徐虎门销烟，成为战争导火索；清廷闭关自守，军备与制度均已落后。',
      course: '1840 年 6 月，英军封锁珠江口，沿海北上，攻陷定海、直逼天津；1841 年再犯广东、福建、浙江；1842 年 8 月攻至南京下关江面，清廷被迫议和。',
      impact: '签订《南京条约》：割香港岛、赔款 2100 万银元、五口通商、协定关税。中国开始沦为半殖民地半封建社会，近代史由此开端。',
      stats: [['战争持续', '2 年'], ['赔款', '2100 万银元'], ['通商口岸', '5 处'], ['割让', '香港岛']],
      refs: ['《南京条约》原文', '虎门销烟', '魏源《海国图志》']
    },
    '甲午战争与《马关条约》': {
      year: '1894—1895',
      tags: ['战争', '外交'],
      summary: '北洋水师覆没，清廷被迫签订《马关条约》，割让台湾并赔款两亿两白银。',
      background: '明治维新后，日本推行大陆政策，以朝鲜为跳板向外扩张；清廷洋务运动重器物而轻制度，海防经费被挪作他用。',
      course: '1894 年丰岛海战爆发，9 月黄海海战北洋舰队损失惨重；1895 年 2 月威海卫陷落，北洋水师全军覆没；清廷派李鸿章赴日议和。',
      impact: '签订《马关条约》：割台湾、澎湖列岛，赔款 2 亿两白银。列强掀起瓜分狂潮，维新与革命思潮相继兴起。',
      stats: [['赔款', '2 亿两白银'], ['割让', '台湾、澎湖'], ['北洋水师', '全军覆没'], ['战争持续', '约 9 个月']],
      refs: ['《马关条约》原文', '黄海海战', '威海卫之战']
    },
    '武昌起义': {
      year: '1911.10.10',
      tags: ['革命', '政治'],
      summary: '新军起义占领武昌，各省纷纷响应，清王朝统治迅速瓦解。',
      background: '《辛丑条约》后清廷权威衰落，保路运动激化社会矛盾；革命党人在新军中长期宣传，共进会与文学社密谋举事。',
      course: '1911 年 10 月 10 日夜，新军工程第八营士兵起义，攻占楚望台军械库，次日成立湖北军政府；两个月内十余省宣布独立。',
      impact: '辛亥革命进入高潮。1912 年 1 月中华民国成立，2 月清帝退位，延续两千余年的君主专制终结。',
      stats: [['起义时间', '1911.10.10'], ['独立省份', '十余省'], ['帝制终结', '2000 余年']],
      refs: ['湖北军政府', '保路运动', '辛亥革命']
    },
    '五四运动': {
      year: '1919',
      tags: ['思想', '爱国'],
      summary: '巴黎和会外交失败引爆全国抗议，中国拒签对德和约，新民主主义革命开端。',
      background: '一战期间中国以战胜国身份参战，期待收回山东权益；巴黎和会却将德国在山东的特权转交日本。',
      course: '1919 年 5 月 4 日，北京学生游行示威，火烧赵家楼；6 月工人罢工、商人罢市，运动中心由北京转向上海，扩展为全国性爱国运动。',
      impact: '中国代表团拒签《凡尔赛和约》。马克思主义传播加速，为中国共产党成立作了思想与干部准备。',
      stats: [['爆发', '1919.5.4'], ['运动高潮', '6 月三罢'], ['结果', '拒签和约']],
      refs: ['巴黎和会', '《凡尔赛和约》', '新文化运动']
    },
    '中国共产党成立': {
      year: '1921.7',
      tags: ['政治', '建党'],
      summary: '中共一大召开，中国革命从此有了新型政党的领导。',
      background: '五四运动后马克思主义广泛传播，各地共产党早期组织相继建立，工人运动兴起，共产国际提供了帮助。',
      course: '1921 年 7 月 23 日，中共一大在上海法租界望志路 106 号开幕，因巡捕搜查转移至浙江嘉兴南湖游船继续举行。',
      impact: '大会通过党的纲领，中国革命由旧民主主义转向新民主主义，政治格局进入政党动员的新阶段。',
      stats: [['召开', '1921.7'], ['代表', '13 名'], ['全国党员', '50 余名'], ['会址', '上海 · 嘉兴南湖']],
      refs: ['中共一大', '嘉兴南湖红船', '《中国共产党第一个纲领》']
    },
    '九一八事变': {
      year: '1931.9.18',
      tags: ['抗战', '军事'],
      summary: '日军自炸铁路反诬中国军队，进攻沈阳，东北沦陷由此开始。',
      background: '日本关东军蓄谋侵占东北，以“满蒙生命线”论制造事端；国民政府全力“剿共”，东北防务空虚。',
      course: '1931 年 9 月 18 日夜，日军自炸南满铁路柳条湖段并嫁祸中国军队，随即进攻北大营与沈阳城；数月内辽宁、吉林、黑龙江相继沦陷。',
      impact: '十四年抗战的起点。东北抗日义勇军与抗日联军兴起，民族危机空前加深，抗日救亡运动高涨。',
      stats: [['事变', '1931.9.18'], ['沦陷', '东北主要城镇'], ['抗战', '14 年起点']],
      refs: ['柳条湖事件', '东北抗日联军', '北大营']
    },
    '西安事变': {
      year: '1936.12.12',
      tags: ['政治', '统一战线'],
      summary: '张学良、杨虎城发动“兵谏”，和平解决后促成第二次国共合作。',
      background: '日军侵逼华北，全国抗日呼声高涨；东北军、十七路军与红军在西北对峙，蒋介石坚持“攘外必先安内”。',
      course: '1936 年 12 月 12 日，张学良、杨虎城在西安华清池扣留蒋介石，提出停止内战、联共抗日的八项主张；中共派周恩来等赴西安调停。',
      impact: '蒋介石接受停止内战、联共抗日。事变成时局转换的枢纽，为抗日民族统一战线的正式形成奠定基础。',
      stats: [['事变', '1936.12.12'], ['历时', '13 天'], ['主张', '8 项']],
      refs: ['华清池', '八项主张', '周恩来赴西安调停']
    },
    '七七事变': {
      year: '1937.7.7',
      tags: ['抗战', '军事'],
      summary: '日军进攻宛平城与卢沟桥，中国守军奋起抵抗，全民族抗战爆发。',
      background: '日军侵占东北后不断蚕食华北，制造“华北特殊化”；卢沟桥是北平西南的咽喉，战略地位关键。',
      course: '1937 年 7 月 7 日夜，日军借口士兵失踪要求进入宛平城搜查被拒，遂炮轰宛平城、进攻卢沟桥；第 29 军奋起抵抗，战事迅速扩大。',
      impact: '全民族抗战爆发，国共两党走向合作。中国战场成为世界反法西斯战争的东方主战场。',
      stats: [['事变', '1937.7.7'], ['守军', '第 29 军'], ['全面抗战', '8 年']],
      refs: ['宛平城', '卢沟桥', '第 29 军']
    },
    '南京大屠杀': {
      year: '1937.12.13',
      tags: ['抗战', '暴行'],
      summary: '日军攻陷南京后展开长达六周的大规模屠杀，超过 30 万同胞遇难。',
      background: '淞沪会战后日军直逼南京，中国军队仓促防御失利；1937 年 12 月 13 日南京陷落。',
      course: '日军在南京及周边地区进行长达六周的有组织屠杀、强奸、抢劫与纵火，遇难者包括放下武器的士兵与手无寸铁的平民。',
      impact: '铁证如山，是二战期间最严重的暴行之一。2014 年起，每年 12 月 13 日为南京大屠杀死难者国家公祭日。',
      stats: [['遇难同胞', '30 万以上'], ['持续', '6 周'], ['公祭日', '12.13']],
      refs: ['南京大屠杀遇难同胞纪念馆', '国家公祭日', '远东国际军事法庭判决书']
    },
    '日本正式签署投降书': {
      year: '1945.9.2',
      tags: ['抗战', '胜利'],
      summary: '东京湾“密苏里”号上签字，中国人民抗日战争胜利结束。',
      background: '1945 年 8 月，美国投下原子弹，苏联对日宣战并出兵东北；8 月 15 日日本天皇广播《终战诏书》。',
      course: '1945 年 9 月 2 日上午 9 时，日本政府代表重光葵、军方代表梅津美治郎在东京湾美国战列舰“密苏里”号上签署投降书；9 月 9 日中国战区受降仪式在南京举行。',
      impact: '中国人民抗日战争胜利结束，台湾回归祖国；世界反法西斯战争取得最终胜利。',
      stats: [['签署', '1945.9.2'], ['抗战', '14 年'], ['军民伤亡', '3500 万以上']],
      refs: ['“密苏里”号战列舰', '《终战诏书》', '南京受降仪式']
    },
    '新中国成立 · 开国大典': {
      year: '1949.10.1',
      tags: ['政治', '建国'],
      summary: '中华人民共和国中央人民政府成立，中国人民从此站立起来。',
      background: '辽沈、淮海、平津三大战役与渡江战役后，国民党政权溃败；1949 年 9 月，中国人民政治协商会议第一届全体会议通过《共同纲领》。',
      course: '1949 年 10 月 1 日下午 3 时，开国大典在北京天安门广场举行。毛泽东宣读《中华人民共和国中央人民政府公告》，升起第一面五星红旗，随后举行阅兵与群众游行。',
      impact: '近代以来民族独立与人民解放的历史任务宣告完成，中国历史进入现代史新阶段。',
      stats: [['大典', '1949.10.1'], ['礼炮', '54 门 28 响'], ['参加群众', '30 万人']],
      refs: ['天安门广场', '《共同纲领》', '中国人民政治协商会议']
    }
  };

  // 用键名补齐标题字段
  for (var name in EVENTS) {
    EVENTS[name].title = name;
  }

  // 详情中的前三个分区
  var SECTIONS = [
    ['background', '背景'],
    ['course', '经过'],
    ['impact', '影响']
  ];

  var veil = null;
  var card = null;
  var yearEl = null;
  var titleEl = null;
  var tagsEl = null;
  var summaryEl = null;
  var sectionsEl = null;
  var statsEl = null;
  var refsEl = null;
  var imgEl = null;
  var capEl = null;
  var closeBtn = null;
  var trigger = null;
  var lockTop = 0;

  // 一次性构建弹窗骨架
  function build() {
    veil = document.createElement('div');
    veil.className = 'ev-veil';
    veil.setAttribute('aria-hidden', 'true');
    veil.innerHTML =
      '<div class="ev-card" role="dialog" aria-modal="true" aria-labelledby="evTitle">' +
        '<button type="button" class="ev-close" aria-label="关闭">×</button>' +
        '<div class="ev-main">' +
          '<div class="ev-year" id="evYear"></div>' +
          '<h2 class="ev-title" id="evTitle"></h2>' +
          '<div class="ev-tags" id="evTags"></div>' +
          '<p class="ev-summary" id="evSummary"></p>' +
          '<div class="ev-detail">' +
            '<div id="evSections"></div>' +
            '<div class="ev-block">' +
              '<div class="ev-block-title"><b>4</b>关键数字</div>' +
              '<div class="ev-stats" id="evStats"></div>' +
            '</div>' +
            '<div class="ev-block">' +
              '<div class="ev-block-title"><b>5</b>相关资料</div>' +
              '<ul class="ev-refs" id="evRefs"></ul>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<figure class="ev-media"><img class="ev-img" id="evImg" alt="" /><figcaption class="ev-cap" id="evCap"></figcaption></figure>' +
      '</div>';
    document.body.appendChild(veil);

    card = veil.querySelector('.ev-card');
    yearEl = veil.querySelector('#evYear');
    titleEl = veil.querySelector('#evTitle');
    tagsEl = veil.querySelector('#evTags');
    summaryEl = veil.querySelector('#evSummary');
    sectionsEl = veil.querySelector('#evSections');
    statsEl = veil.querySelector('#evStats');
    refsEl = veil.querySelector('#evRefs');
    imgEl = veil.querySelector('#evImg');
    capEl = veil.querySelector('#evCap');
    closeBtn = veil.querySelector('.ev-close');

    closeBtn.addEventListener('click', close);
    veil.addEventListener('click', function (e) {
      if (e.target === veil) close();
    });
    imgEl.addEventListener('error', function () {
      imgEl.parentNode.style.display = 'none';
    });
    document.addEventListener('keydown', function (e) {
      if (!veil.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') trapFocus(e);
    });
  }

  function trapFocus(e) {
    var items = Array.prototype.filter.call(
      card.querySelectorAll('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null; }
    );
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // 填充卡片内容
  function fill(ev) {
    yearEl.textContent = ev.year;
    titleEl.textContent = ev.title;
    tagsEl.innerHTML = ev.tags.map(function (t) {
      return '<span class="ev-tag">' + t + '</span>';
    }).join('');
    summaryEl.textContent = ev.summary;

    sectionsEl.innerHTML = SECTIONS.map(function (item, i) {
      return '<div class="ev-block">' +
        '<div class="ev-block-title"><b>' + (i + 1) + '</b>' + item[1] + '</div>' +
        '<p>' + ev[item[0]] + '</p>' +
      '</div>';
    }).join('');

    statsEl.innerHTML = ev.stats.map(function (s) {
      return '<div class="ev-stat"><span>' + s[0] + '</span><b>' + s[1] + '</b></div>';
    }).join('');

    refsEl.innerHTML = ev.refs.map(function (r) {
      return '<li>' + r + '</li>';
    }).join('');

    // 配图按事件名存放在 images 目录下
    imgEl.parentNode.style.display = '';
    imgEl.src = 'images/' + encodeURIComponent(ev.title) + '.jpg';
    imgEl.alt = ev.title;
    capEl.textContent = ev.year;

    card.scrollTop = 0;
  }

  // 读取当前实际滚动位置（本页由 body 承担滚动）
  function getScrollTop() {
    return Math.max(document.body.scrollTop, document.documentElement.scrollTop, window.pageYOffset || 0);
  }

  function open(ev, el) {
    if (!veil) build();
    fill(ev);
    lockTop = getScrollTop();
    // 用固定定位冻结页面，避免遮罩打开时背景滚动
    document.body.style.top = -lockTop + 'px';
    document.body.classList.add('ev-lock');
    veil.classList.add('open');
    veil.setAttribute('aria-hidden', 'false');
    trigger = el;
    closeBtn.focus();
  }

  function close() {
    if (!veil.classList.contains('open')) return;
    veil.classList.remove('open');
    veil.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ev-lock');
    document.body.style.top = '';
    // 解除冻结后回到原来的滚动位置
    document.body.scrollTop = lockTop;
    document.documentElement.scrollTop = lockTop;
    if (trigger) trigger.focus();
  }

  // 给有数据的事件名绑定点击 / 键盘事件
  var names = document.querySelectorAll('.tl-name');
  for (var i = 0; i < names.length; i++) {
    var el = names[i];
    var ev = EVENTS[el.textContent.trim()];
    if (!ev) continue;
    el.classList.add('ev-link');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-haspopup', 'dialog');
    (function (data, node) {
      node.addEventListener('click', function () {
        open(data, node);
      });
      node.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(data, node);
        }
      });
    })(ev, el);
  }
})();

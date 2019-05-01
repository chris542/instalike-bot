class InstaBot {
    constructor(){
        this.s = 1000;
        this.min = 60 * this.s;
        this.hr = 60 * this.min;
        this.time = {
            start: performance.now(),
            delayInitial: 2 * this.s,
            delayLike: 3 * this.s, // Delay to like the image
            delayNext: 4 * this.s, // Delay to load next image
            delayComment: 4 * this.s, // Delay to comment
            maxDuration: 10 * this.min, // Max runtime before the script stops liking
        };
        this.conditions = {
            isFollowing : true,
            includeTop: true,
            maxFollows: 15,
            maxLiked: 80,
            minLikes: 20,
            maxLikes : 300,
            isFiltering: true,
            imageAlt : [ 
                '1 person','people','closeup','selfie',
            ],
            include: [
                '인스타','인친',
                "라이크",'좋아요','좋아요환영','좋아요반사','라이크반사','반사','l4l','like','instalike',
                'follow','followme','맞팔','팔로우','맞팔해요','f4f',
            ] || [],
            exclude: [
                '10k','20k','30k','10kfollowers','20kfollowers',
                '흔남','훈남','셀기꾼',
                '육아스타그램','육아',
                '맛집',
            ]
        }
        this.comments = {
            conditions : {
                followback : ['선팔맞팔','선팔하면맞팔','선팔하면맞팔가요','맞팔'],
                likeback : ['좋아요반사','라이크반사','좋반']
            },
            comments : {
                followback: [
                    '선팔하고 가요! 맞팔해주세용','선팔했습니다아아! 맞팔해용','선팔합니다~ 맞팔해주시꺼죠?',
                    '맞팔해요','맞팔해주세요','맞팔할까요','반가워요! 먼저 팔로우하고 갈게요','먼저 팔로합니다!',
                ],
                likeback: [
                    '피드 잘보구가요','좋아요하구갑니다','안녕하세요 :) 조아요누르고가요','제꺼두 좋아요 눌러주시와요 ㅋㅋ','죠아욧!','굳굳','좋반요!','좋아요반사요!','좋반이요','좋아요 반사왔어요~~',
                ]
            },
            emoji: [ '😊','😛','🤗','😄','🤙','👍','🙌','🙏','' ]
        }
        this.actions = {
            likes: 0, // How many I liked
            follows:[], //People I followed
            archiveFollowed:[],
            stopped: false,
        };
        this.element = {
            name : 'a.notranslate:first-child',
            image: 'article div[role=button] .KL4Bh img.FFVAD',
            post: "a[href*='/p/']:not(.zV_Nj)",
            recentPost : '.yQ0j1:nth-child(2) ~ div a[href*="/p/"]:not(.zV_Nj)',
            numberOfLikes : `article section div div:last-child button[type=button] span,
                             article section div div:last-child a.zV_Nj span`,
            likeBtn:'article span.glyphsSpriteHeart__outline__24__grey_9.u-__7',
            reply: 'span.EizgU',
            extraReply: 'span.glyphsSpriteCircle_add__outline__24__grey_9.u-__7',
            tags : 'article a[href*="/tags/"]',
            nextBtn: 'a.coreSpriteRightPaginationArrow',
            followBtn: 'button.oW_lN:not(._8A5w5)',
            followersBtn : 'a.-nal3, a._81NM2',
            followersOverHidden : '.isgrP',
            followersInnerHeight : 'ul.jSC57._6xe7A',
            followersList: 'a.FPmhX.notranslate._0imsa',
            followerPopupCloseBtn:'span[aria-label="Close"]',
            followerPopupLoadingIcon : '.W1Bne.ztp9m',
            suggestionsTitle: 'h4._7UhW9',
            commentPostBtn : '.X7cDz button',
        }
        this.createUI();
    }
    status(){
        console.log(`%cSettings`,'font-size:10px;font-weight:bold;')
        console.log(`%cDuration? : ${this.time.maxDuration/this.min} min`,'font-size:8px;')
        console.log(`%cFiltering? : ${this.conditions.isFiltering}`,'font-size:8px;')
        if(this.conditions.isFiltering){
            console.log(`%cLike limit ? : ${this.conditions.maxLiked}`,'font-size:8px;')
            console.log(`%cLikes max ? : ${this.conditions.maxLikes} likes`,'font-size:8px;')
            console.log(`%cLikes min ? : ${this.conditions.minLikes} likes`,'font-size:8px;')
            console.log(`%cIncluded Tags? : ${this.conditions.include.join(',')}`,'font-size:8px;')
            console.log(`%cExcluded Tags? : ${this.conditions.exclude.join(',')}`,'font-size:8px;')
            console.log(`%cComment if? : ${this.comments.conditions.likeback.join(',') + this.comments.conditions.followback.join(',')}`,'font-size:8px;')
        } else {
            console.log(`InstaBot will like anything but won't follow nor comment`)
        }
        console.log(`%cResults`,'font-size:10px;font-weight:bold;')
        console.log(`%c Current liked : ${this.actions.likes}`,'font-size:8px;')
        console.log(`%c Current follows : ${this.actions.archiveFollowed.length + this.actions.follows.length}`,'font-size:8px;')
        if(this.actions.archiveFollowed.length>0){
            this.actions.archiveFollowed.forEach((f)=>{
                console.log(`%c${f.personName}: ${f.personLink}`, "font-weight:bold; font-size:8px;");
            })
        }
        if(this.actions.follows.length>0){
            this.actions.follows.forEach((f)=>{
                console.log(`%c${f.personName}: ${f.personLink}`, "font-weight:bold; font-size:8px;");
            })
        }
    }
    createUI(){
        const left = document.createElement("DIV");
        const right = document.createElement("DIV");
        left.style="position:fixed;bottom:10px;left:10px;padding:15px;z-index:99;"
        right.style="position:fixed;bottom:10px;right:10px;padding:15px;z-index:99;"
        document.body.appendChild(left);
        document.body.appendChild(right);

        this.createStatusBtn(right);
        this.createFilterUnfollowersBtn(right);
        this.createLikeAllBtn(right);
        this.createStartBtn(right);

        this.createToggleIncludeTop(left);
        this.createToggleIsFollowingBtn(left);
        this.createToggleFilter(left);
    }
    createBtn({text, bgc, parent}, cb){
        const self = this;
        const btn = document.createElement("BUTTON");
        btn.innerHTML = text;
        btn.style=`padding:15px;background:${bgc};color:white;outline:none;`
        parent.appendChild(btn);
        return cb(btn);
    }
    createStatusBtn(parent){
        const self = this;
        const btn = this.createBtn({
            text:"Status",
            bgc: "dodgerblue",
            parent,
        },b=>{
            b.addEventListener('click',function(){
                self.status();
            })
        })
    }
    createLikeAllBtn(parent){
        const self = this;
        const btn = this.createBtn({
            text:"Like All on feed",
            bgc: "dodgerblue",
            parent,
        },b=>{
            b.addEventListener('click',function(){
                self.likeAllOnMyFeed();
            })
        })
    }
    createToggleIsFollowingBtn(parent){
        const self = this;
        const btn = this.createBtn({
            text:"Following ON",
            bgc: "SteelBlue",
            parent,
        },b=>{
            b.addEventListener('click',function(){
                self.toggleIsFollowing();
                this.classList.toggle('deactivated');
                if(this.className == 'deactivated'){
                    this.style.background = 'tomato';
                    this.innerText = "Following OFF"
                } else {
                    this.style.background="SteelBlue";
                    this.innerText = "Following ON"
                }
            })
        })
    }
    createToggleFilter(parent){
        const self = this;
        const btn = this.createBtn({
            text:"Filtering ON",
            bgc: "SteelBlue",
            parent,
        },b=>{
            b.addEventListener('click',function(){
                self.toggleFilter();
                this.classList.toggle('deactivated');
                if(this.className == 'deactivated'){
                    this.style.background = 'tomato';
                    this.innerText = "Filtering OFF"
                } else {
                    this.style.background="SteelBlue";
                    this.innerText = "Filtering ON"
                }
            })
        })
    }
    createToggleIncludeTop(parent){
        const self = this;
        const btn = this.createBtn({
            text:"From Top",
            bgc: "SteelBlue",
            parent,
        },b=>{
            b.addEventListener('click',function(){
                self.toggleIncludeTop();
                this.classList.toggle('deactivated');
                if(this.className == 'deactivated'){
                    this.style.background = 'tomato';
                    this.innerText = "From Recent"
                } else {
                    this.style.background="SteelBlue";
                    this.innerText = "From Top"
                }
            })
        })
    }
    createFilterUnfollowersBtn(parent){
        const self = this;
        const btn = this.createBtn({
            text:"Show unfollowers", bgc: "teal", parent,
        },b=>{
            b.addEventListener('click',function(){
                self.showWhoUnfollowedMe();
            })
        })
    }
    createStartBtn(parent){
        const self = this;
        const btn = this.createBtn({
            text:"Start Instabot",
            bgc: "orange",
            parent,
        },b=>{
            b.addEventListener('click',function(){
                self.init();
                self.createStopBtn(parent);
                this.parentNode.removeChild(this); return this;
            })
        })
    }
    createStopBtn(parent){
        const self = this;
        const btn = this.createBtn({
            text:"Stop",
            bgc: "tomato",
            parent,
        },b=>{
            b.addEventListener('click',function(){
                self.stop();
                self.createStartBtn(parent);
                this.parentNode.removeChild(this); return this;
            })
        })
    }
    init(){
        this.actions.stopped = false;
        this.time.start = performance.now();
        if(this.actions.likes > 0){
            console.log(`Resetting likes from ${this.actions.likes} to 0`)
            this.actions.likes = 0;
        }
        if(this.actions.follows.length > 0){
            console.log(`Resetting followers from ${this.actions.likes} to 0`)
            this.actions.archiveFollowed = [ ...this.actions.follows, ...this.actions.archiveFollowed ];
            this.actions.follows = [];
        }
        const post = (this.conditions.includeTop)?document.querySelector(this.element.post):document.querySelector(this.element.recentPost)
        post.click();

        const delay = (Math.random()+0.3)*this.time.delayInitial;
        this.waitFor(delay,()=>{
            this.processPost(); // Initial like to start off the chain reaction
        })
    }
    getName(){
        return document.querySelector(this.element.name) != null
            ? {
                personName : document.querySelector(this.element.name).innerText,
                personLink : document.querySelector(this.element.name).href,
            }
            : console.log(`%cCouldn't load name. Retrying...`,'font-size:8px; color:red!important;') 
            && setTimeout(()=>document.querySelector(this.element.name) != null 
                ? {
                    personName : document.querySelector(this.element.name).innerText,
                    personLink : document.querySelector(this.element.name).href,
                }
                : null
                ,delay);
    }
    getNumberOfLikes(){
        return document.querySelector(this.element.numberOfLikes) != null
            ? parseInt(document.querySelector(this.element.numberOfLikes).innerText.replace(',','')) 
            :100;
    }
    checkTags(){
        const tags = document.querySelectorAll(this.element.tags);
        const hasTag = (this.conditions.include.length > 0 )
            ? Array.from(tags)
            .filter(function(w){
                return this.indexOf(w.innerText.replace('#','')) >= 0;
            },this.conditions.include)
            .map((tag)=>{
                return tag.innerText.replace('#','');
            })
            :[];
        const hasExcludes = (this.conditions.exclude.length > 0)
            ? Array.from(tags)
            .filter(function(w){
                return this.indexOf(w.innerText.replace('#','')) >= 0;
            },this.conditions.exclude)
            .map((tag)=>{
                return tag.innerText.replace('#','');
            })
            :[];
        const hasF4F = (this.comments.conditions.followback.length > 0 )
            ? Array.from(tags)
            .filter(function(w){
                return this.indexOf(w.innerText.replace('#','')) >= 0;
            },this.comments.conditions.followback)
            :[];
        const hasL4L = (this.comments.conditions.likeback.length > 0 )
            ? Array.from(tags)
            .filter(function(w){
                return this.indexOf(w.innerText.replace('#','')) >= 0;
            },this.comments.conditions.likeback)
            :[];
        return {
            hasTag,
            hasExcludes,
            hasF4F:hasF4F.length>0,
            hasL4L:hasL4L.length>0,
        }
    }
    checkImageAlt(){
        const alt = document.querySelector(this.element.image)?document.querySelector(this.element.image).alt:null
        if(alt!=null){
            const isSafe = this.conditions.imageAlt.some((v)=> {
                return alt.indexOf(v) >= 0;
            });
            if(isSafe) console.log(`%c ${alt}`, 'font-size:8px;');
            return isSafe;
        } else {
            return false;
        }
    }
    likePost(){
        const delay = (Math.random()+0.3)*this.time.delayInitial;
        const likebtn = document.querySelector(this.element.likeBtn);
        this.waitFor(delay,()=>{
            if(likebtn){
                likebtn.click();
                this.actions.likes++
                console.log(`%cLike count:  ${this.actions.likes}`, "font-weight:bold; font-style:italic; ");
            } else {
                console.log(`%cAlready liked.`,'font-size:8px; color:red!important;');
            }
        })
    }
    processPost(){
        console.log(`%c=======================`,'color:white;');
        const delay = (Math.random()+0.3)*this.time.delayInitial;
        this.waitFor(delay, ()=>{
            const { personName, personLink } = this.getName() || {};
            const numberOfLikes = this.getNumberOfLikes();
            const isImage = document.querySelector(this.element.image)?document.querySelector(this.element.image):false;
            console.log(`%c Analyzing %c${personName}`,'color:dodgerblue;font-weight:bold;','background:GoldenRod;color:white!important;text-decoration:underline;');
            console.log(`%c${personLink}`,'font-size:8px;');
            if( personName != null && isImage
                && ((numberOfLikes >= this.conditions.minLikes && numberOfLikes <= this.conditions.maxLikes && this.conditions.isFiltering) 
                || !this.conditions.isFiltering) 
            ){
                const extraReply = document.querySelectorAll(this.element.extraReply); extraReply? extraReply.forEach((t)=>t.click()):true;
                const reply = document.querySelectorAll(this.element.reply); reply ? reply.forEach((t)=>t.click()):true;
                const tags = this.checkTags();

                if(( tags.hasTag.length > 0 && tags.hasExcludes == 0 && this.conditions.isFiltering ) || !this.conditions.isFiltering){
                    if(!this.conditions.isFiltering){
                        console.log(`%c Not Filtering:`,'font-size:8px; color:lightgray!important;');
                    } else {
                        console.log(`%cFound matching ${tags.hasTag.length} tags:`,'font-size:8px; color:lightgray!important;', tags.hasTag.join(','));
                        console.log(`%cThis person has ${numberOfLikes} likes.`,'font-size:8px; color:lightgray!important;');
                    }
                    (this.conditions.isFiltering)?this.writeComment(tags):false;
                    this.likePost();
                    this.goToNextImage();
                } else {
                    if(tags.hasExcludes.length > 0){
                        console.log(`%cFound unwanted tags:`,'font-size:8px; color:lightgray!important;', tags.hasExcludes.join(','));
                    } else {
                        console.log(`%cNo Matching tags.`,'font-size:8px; color:red!important;');
                    }
                    this.goToNextImage();
                }
            } else {
                if(personName == null) {
                    console.log(`%c Couldn't load the person`, 'font-size:8px; color:red!important;');
                } else {
                    (numberOfLikes <= this.conditions.minLikes)
                        ?console.log(`%c Too little likes`, 'font-size:8px; color:red!important;'):null;
                    (numberOfLikes >= this.conditions.maxLikes) 
                        ?console.log(`%c Too many likes`, 'font-size:8px; color:red!important;'):null;
                }
                this.goToNextImage();
            }
        });
    }
    goToNextImage(){
        const delay = (Math.random()+0.4)* this.time.delayNext;
        const el = document.querySelector(this.element.nextBtn);
        if(this.actions.likes >= this.conditions.maxLiked) { 
            console.log(`%cYou have already liked ${this.conditions.maxLiked} images. Restarting will reset`,'font-weight:bold;font-size:8px;');
            this.stop();
        }  
        if(performance.now() - this.time.start < this.time.maxDuration && !this.actions.stopped){
            console.log(`%cAvailable likes Remaining: ${this.conditions.maxLiked - this.actions.likes}`,'color:gray;font-size:6px;font-style:italic');
            console.log(`%cFollowed: ${this.actions.follows.length}`,'color:gray;font-size:6px;font-style:italic');
            console.log(`%cTime remaining: ${ Math.round((this.time.maxDuration - (performance.now() - this.time.start))/this.min*10)/10} minutes`,'color:gray;font-size:6px;font-style:italic');
            this.waitFor(delay, ()=>{
                el ? el.click() : true;
                this.processPost();
            });
        }
        else{
            console.log(`%c=======================`,'color:white;');
            console.log("%cAll done here...",'font-weight:bold; font-size:14px;color:green;');
            console.log(`%cTotal Like count: ${this.actions.likes} images`, "font-weight:bold; font-size:12px;");
            if(this.actions.follows.length>0){
                console.log(`%cTotal Follow count: ${this.actions.follows.length}`, "font-weight:bold; font-size:12px;");
                this.actions.follows.forEach((f)=>{
                    console.log(`%c${f.personName}: ${f.personLink}`, "font-weight:bold; font-size:8px;");
                })
            }
        }
    }
    async showWhoUnfollowedMe(){
        const following = await this.loadFollowers(true);
        const followers = await this.loadFollowers(false);
        const unfollowers = following.filter(function(f){
            return this.indexOf(f) == -1;
        },followers)
        console.log(`You have ${unfollowers.length} people who are not following back:`)
        unfollowers.forEach((f)=>{
            console.log(`%c ${f} :  https://www.instagram.com/${f}`,'font-size:8px;color:grey;')
        })
    }
    async loadFollowers(loadingFollowings){
        (loadingFollowings)
            ?console.log("Loading user's following list.. Please wait.." )
            :console.log("Loading user's followers... Please wait...")
        return new Promise(async resolve => {
            const flBtn = document.querySelectorAll(this.element.followersBtn);
            (loadingFollowings)
                ? flBtn[flBtn.length-1].click()
                : flBtn[0].click()
            const result = await this.fetchPeople();
            resolve(result);
        })
    }
    fetchPeople(){
        return new Promise(resolve => {
            this.waitFor(1500,()=>{
                const itvl = setInterval(()=>{
                    const scroll = document.querySelector(this.element.followersOverHidden);
                    const loadedHeight = document.querySelector(this.element.followersInnerHeight).scrollHeight
                    const isLoading = (document.querySelector(this.element.suggestionsTitle))
                    ? scroll.scrollTop != loadedHeight
                    : (document.querySelector(this.element.followerPopupLoadingIcon))?true:scroll.scrollTop + scroll.offsetHeight != loadedHeight 
                    if(isLoading){
                        scroll.scrollTop = loadedHeight;
                    } else {
                        clearInterval(itvl);
                        const list = Array.from(document.querySelectorAll(this.element.followersList)).map((p)=>{
                            return p.innerText
                        })
                        document.querySelector(this.element.followerPopupCloseBtn).click()
                        console.log(`%cFinished collecting`,'font-size:8px;color:grey;');
                        this.waitFor(1000,()=>{
                            resolve(list)
                        })
                    }
                }, 1000)
            })
        })
    }
    generateRandomComment(c){ return c[Math.floor(Math.random()*c.length)] }
    async writeComment({ hasF4F, hasL4L }){
        const f4fcom = this.comments.comments.followback;
        const l4lcom = this.comments.comments.likeback;
        const notFollowed = document.querySelector(this.element.followBtn);
        const isSafeToFollow = hasF4F && this.checkImageAlt();
        if(
            this.conditions.isFiltering 
            && notFollowed 
            && (isSafeToFollow || hasL4L)
        ){
            const input = document.querySelector('.Ypffh'); 
            if(input){
                const lastValue = input.value;
                const generatedComment = 
                    (hasF4F && this.conditions.isFollowing)
                    ? this.generateRandomComment(f4fcom)
                    :(hasL4L)
                    ? this.generateRandomComment(l4lcom)
                    :null;
                const generateEmoji = this.generateRandomComment(this.comments.emoji)
                input.value = generatedComment + generateEmoji;
                const event = new Event('change', { bubbles: true });
                event.simulated = true;
                const tracker = input._valueTracker;
                if (tracker) {
                    tracker.setValue(lastValue);
                }
                input.dispatchEvent(event);
                if(generatedComment != null){
                    const submittedComment = await this.submitComment(generatedComment);
                    (submittedComment && this.conditions.isFollowing)
                        ? await this.follow(hasF4F)
                        : console.log(`%cNot following because couldn't comment...`)
                } 
            } else {
                console.log(`%cComment Disabled!`,'font-size:8px;');
            }
        } else if (isSafeToFollow) {
            console.log(`%cComment skipped!.`,'font-size:8px; color:red!important;');
        } else if(!notFollowed) {
            console.log(`%cAlready followed. Not leaving comments.`,'font-size:8px; color:red!important;');
        }
    }
    submitComment(comment){
        const delay = (Math.random()+0.5)*this.time.delayComment;
        const btn = document.querySelector(this.element.commentPostBtn);
         return new Promise(resolve=>{
             if(btn){
                 btn.click()
                 console.log(`%cPosted comment: "${comment}"`, 'font-weight:bold; font-style:italic; ')
                 console.log(`%c${window.location.href}`, 'font-size:8px;font-style:italic;')
                 this.waitFor(delay,()=>{
                     resolve(true);
                 })
             } else {
                 resolve(false);
             }
         })
    }
    follow(hasF4F){
        return new Promise(resolve=>{
            if(hasF4F && this.conditions.isFiltering && this.conditions.isFollowing){
                const likes = this.getNumberOfLikes();
                if(
                    likes >= this.conditions.minLikes && likes <= this.conditions.maxLikes 
                    && this.actions.follows.length < this.conditions.maxFollows
                ){
                    const person = this.getName();
                    const followBtn = document.querySelector(this.element.followBtn)
                    if(followBtn){
                        followBtn.click();
                        this.actions.follows.push(person);
                        console.log(`%cFollowed: ${person.personLink}`, "font-weight:bold; font-style:italic; ");
                        resolve(true);
                    }
                } else {
                    if(this.actions.follows.length >= this.conditions.maxFollows){
                        console.log('%c FOLLOW LIMIT EXCEEDED', 'font-size:8px;font-weight:bold;');
                    }
                    resolve(false);
                }
            }
        })
    }
    likeAllOnMyFeed(){
        document.querySelectorAll(this.element.likeBtn).forEach((b)=>{
            b.click()
        })
    }
    toggleIsFollowing(){
        this.conditions.isFollowing = !this.conditions.isFollowing;
        this.conditions.isFollowing
            ? console.log(`%c Following ON`, 'background:green;color:white!important;')
            : console.log(`%c Following OFF`, 'background:red;color:white!important;')
    }
    toggleIncludeTop(){
        this.conditions.includeTop = !this.conditions.includeTop;
        this.conditions.includeTop
            ? console.log(`%c Start from Top`, 'background:green;color:white!important;')
            : console.log(`%c Start from Recent`, 'background:red;color:white!important;')
    }
    toggleFilter(){
        this.conditions.isFiltering = !this.conditions.isFiltering;
        this.conditions.isFiltering
            ? console.log(`%c Filtering turned ON`, 'background:green;color:white!important;')
            : console.log(`%c Filtering turned OFF`, 'background:red;color:white!important;')
    }
    stop(){
        console.log(`%c STOPPED`, 'font-weight:bold;');
        this.actions.stopped = true;
    }
    waitFor(_s, _c){
        setTimeout(_c, _s);
    }
}
const instabot = new InstaBot();
clear();

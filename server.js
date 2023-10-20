const express = require('express');
const app = express();
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const MongoStore = require('connect-mongo');

dotenv.config();
app.use(express.json());
app.use(express.urlencoded({extended: true}))

app.set('view engine', 'ejs'); //ejs셋팅 문법

const {MongoClient, ObjectId} = require('mongodb');

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

let db;
let sample;
const url = `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PW}@admin.z9ho4mc.mongodb.net/`
app.use(express.static(__dirname + '/public'))

new MongoClient(url).connect().then((client)=>{
    db = client.db("board");
    sample = client.db("sample_training")
    console.log("db연결완료!!")
    app.listen(process.env.SERVER_PORT, ()=>{
        console.log(`${process.env.SERVER_PORT}번호에서 서버 실행 중`)
    })
}).catch((error)=>{
    console.log(error);
})

// app.listen(5000, ()=>{
//     console.log("5000번 포트 서버 실행")
// })

app.get('/', (req,res)=>{
    //res.send("Hellow world");
    res.sendFile(__dirname + '/page/index.html')
}) //sendFile 파일을 내보내겠다 

app.get('/about', (req,res)=>{
    //res.send("어바웃 페이지");
    res.sendFile(__dirname + '/page/about.html')
    // db.collection("notice").insertOne({
    //     title : "첫번째 글",
    //     content : "두번째 글"
    // })
})

app.get('/list', async (req,res)=>{

    const result = await db.collection("notice").find().limit(5).toArray()
    //console.log(result[0])

    res.render("list.ejs", {
        data : result
    }); //데이터를 다 보내준다.
})

app.get('/list/:id', async (req,res)=>{

    const result = await db.collection("notice").find().skip((req.params.id - 1)*5).limit(5).toArray()
    //console.log(result[0])

    res.render("list.ejs", {
        data : result
    }); //데이터를 다 보내준다.
})

app.get('/notice', (req,res)=>{
    res.send("노티스 페이지");
})

app.get('/view/:id', async (req,res)=>{
    const result = await db.collection("notice").findOne({
        _id : new ObjectId(req.params.id)
    })
    //console.log(result)
    // send는 2개 보낼 수 없다.
    res.render("view.ejs", {
        data : result
    });
})

app.get('/write', (req,res)=>{
    res.render('write.ejs')
})

app.get('/portfolio', (req,res)=>{
    res.send("포트폴리오 페이지");
})

app.post('/add', async (req,res)=>{
    console.log(req.body);
    await db.collection("notice").insertOne({
        title : req.body.title,
        content : req.body.content
    })
    res.send("성공!")
}) 
// 복사해서 붙혀넣기

//지우는 코드
// app.get('/delete/:id', async (req, res) =>{
//     try{
//         await db.collection("notice").deleteOne({
//             _id : new ObjectId(req.params.id)
//         })
//         const result = "";}
//         catch(error){
//             console.log(error)
//         }
//     })

// 지우는 코드
app.get('/delete/:id', async(req, res)=>{
    await db.collection("notice").deleteOne({
        _id : new ObjectId(req.params.id)
})
res.redirect('/list')
})

app.put('/edit', async (req,res)=>{
    // updateOne({문서}, {
        //$set : {원하는 키 : 변경값}
// }) 수정하는 방법
console.log(req.body)
    await db.collection("notice").updateOne({
        _id : new ObjectId(req.body._id)
    }, {
        $set : {
            title : req.body.title,
            content : req.body.content
        }
    })
    const result = "";
    res.send(result)
})

app.get('/edit/:id', async (req,res)=>{
    const result = await db.collection("notice").findOne({
        _id : new ObjectId(req.params.id)
    })
    // send는 2개 보낼 수 없다.
    res.render("edit.ejs", {
        data : result
    });
})

//로그인 위해 써줘야 한다.
passport.use(new LocalStrategy({
    usernameField : 'userid',
    passwordField : 'password'
},async (userid,password,cb)=>{
    let result = await db.collection("users").findOne({
        userid : userid
    })
    //console.log(result)
    //cb는 도중에 실행한다
    if(!result){
        return cb(null, false, {Message: "아이디나 비밀번호가 일치하지않습니다."})
    }

    const passChk = await bcrypt.compare(password, result.password)
    console.log(passChk)

    if(passChk){
        return cb(null, result)
    }else{
        return cb(null, false, {Message: "아이디나 비밀번호가 일치하지않음"})
    }
}))
passport.serializeUser((user,done)=>{
    process.nextTick(()=>{
        //done(null, 세션에 기록할 내용)
        done(null, {id: user._id, userid: user.userid})
    })
})

passport.deserializeUser(async (user, done)=>{
    let result = await db.collection("user").findOne({
        _id: new ObjectId(user.id)
    })
    delete result.password
    console.log(result)
    process.nextTick(()=>{
        done(null, result);
    })
})

app.use(passport.initialize());
app.use(session({
    secret : "암호화에 쓸 비번", //세션 문서의 암호화
    resave : false, //유저가 서버로 요청할 때마다 갱신할건지
    saveUninitialized : false, //로그인 안해도 세션 만들건지
    cookie: {maxAge: 60 * 60* 1000}, //로그인 유지 시간
    store: MongoStore.create({
        mongoUrl: `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PW}@admin.z9ho4mc.mongodb.net/`,
        dbName: "board"
    })
}))
app.use(passport.session());


//로그인
app.get('/login', (req,res)=>{
    res.render('login.ejs')
})
app.post('/login', async(req,res,next)=>{
    //console.log(req.body);
    passport.authenticate('local', (error, user, info)=>{
        console.log(error, user, info)
        if(error) return res.status(500).json(error);
        if(!user) return res.status(401).json(info.message); // user는 성공, info는 실패했을때
        req.logIn(user, (error)=>{
            if(error) return next(error);
            res.redirect('/')
        })
    })(req,res,next)
})

//회원가입
app.get('/register', (req,res)=>{
    res.render('register.ejs')
})

app.post('/register', async(req,res)=>{

    let hashPass = await bcrypt.hash(req.body.password, 10); //국룰로 10으로 설정함
    //console.log(hashPass)

    try{
        await db.collection("users").insertOne({
            userid : req.body.userid,
            password : hashPass
        })
    }catch(error){
            console.log(error)
        }
        res.redirect('/list')
    }
)

// 1. Uniform Interface
// 여러 URL 과 METHOD 는 일관성이 있어야 하며, 하나의 URL에서는 하나의 데이터만 가져오게 디자인하며, 간결하고 예측 가능한 URL과 METHOD를 만들어야 한다.
// 동사보다는 명사 위주
// 띄어쓰기는 언더바 대신 대시 기호
// 파일 확장자는 사용금지
// 하위 문서를 뜻할 땐 / 기호를 사용

// 2. 클라이언트와 서버역할 구분
// 유저에게 서버 역할을 맡기거나 직접 입출력을 시키면 안된다.

// 3. stateless
// 요청들은 서로 의존성이 있으면 안되고, 각각 독립적으로 처리되어야 한다.

// 4. Cacheable
// 서버가 보내는 자료는 캐싱이 가능해야한다. - 대부분 컴퓨터가 동작

// 5. Layered System
// 서버 기능을 만들 때 레이어를 걸쳐서 코드가 실행되어야 한다.(몰라도 됨)

// 6. Code on Demeand
// 서버는 실행 가능한 코드를 보낼 수 있다. (몰라도 됨)
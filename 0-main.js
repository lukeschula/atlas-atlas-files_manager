import redisClient from './utils/redis';

(async () => {
    // Added await because redis.js isAlive() is an Async Func
    console.log(await redisClient.isAlive());
    console.log(await redisClient.get('myKey'));
    await redisClient.set('myKey', 12, 5);
    console.log(await redisClient.get('myKey'));

    setTimeout(async () => {
        console.log(await redisClient.get('myKey'));
    }, 1000*10)
})();
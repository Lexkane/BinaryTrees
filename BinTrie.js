const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
    mainThread();
} else {
    workerThread(workerData);
}

async function mainThread() {
    const maxDepth = Math.max(6, parseInt(process.argv[2]));

    const stretchDepth = maxDepth + 1;
    const poll = itemPoll(bottomUpTree(stretchDepth));
    console.log(`stretch depth tree ${stretchDepth}\t poll: ${poll}`);

    const longLivedTree = bottomUpTree(maxDepth);

    const tasks = [];
    for (let depth = 4; depth <= maxDepth; depth += 2) {
        const iterations = 1 << maxDepth - depth + 4;
        tasks.push({iterations, depth});
    }

    const results = await runTasks(tasks);
    for (const result of results) {
        console.log(result);
    }

    console.log(`long lived tree depth ${maxDepth}\t poll: ${itemPoll(longLivedTree)}`);
}

function workerThread({iterations, depth}) {
    parentPort.postMessage({
        result: work(iterations, depth)
    });
}

function runTasks(tasks) {
    return new Promise(resolve => {
        const results = [];
        let tasksSize = tasks.length;

        for (let i = 0; i < tasks.length; i++) {
            const worker = new Worker(__filename, {workerData: tasks[i]});

            worker.on('message', message => {
                results[i] = message.result;
                tasksSize--;
                if (tasksSize === 0) {
                    resolve(results);
                }
            });
        }
    });
}

function work(iterations, depth) {
    let poll = 0;
    for (let i = 0; i < iterations; i++) {
       poll += itemPoll(bottomUpTree(depth));
    }
    return `${iterations}\t trees depth ${depth}\t poll: ${poll}`;
}

function TreeNode(left, right) {
    return {left, right};
}

function itemPoll(node) {
    if (node.left === null) {
        return 1;
    }
    return 1 + itemPoll(node.left) + itemPoll(node.right);
}

function bottomUpTree(depth) {
    return depth > 0
        ? new TreeNode(bottomUpTree(depth - 1), bottomUpTree(depth - 1))
        : new TreeNode(null, null);
}

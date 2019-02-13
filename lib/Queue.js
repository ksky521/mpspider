const EventEmitter = require('events').EventEmitter;

class Queue extends EventEmitter {
    constructor(task, maxConcurrency = 1) {
        super();
        this.task = task;
        this.stacks = [];
        this._runningCount = 0;
        this.maxConcurrency = maxConcurrency;
        this.deferred = {};
        this.status = 'ready';
        this._result = [];
        this.totalCount = 0;
    }
    getLength() {
        return this.stacks.length;
    }
    clear() {
        this.status = 'ready';
        this.stacks.length = 0;
        this._runningCount = 0;
        this._result.length = 0;
        return this;
    }
    add(args) {
        if (!Array.isArray(args)) {
            args = [args];
        }
        if (this.status === 'ready') {
            this.totalCount = this.stacks.push(args);
        } else {
            throw new Error('Queue: when status is ready can add new task');
        }
        return this;
    }
    run() {
        if (this.status !== 'ready') {
            throw 'status error';
        }
        this.status = 'running';

        const deferred = this.deferred;
        if (!deferred.promise) {
            deferred.promise = new Promise((resolve, reject) => {
                deferred.resolve = resolve;
                deferred.reject = reject;
                this._run();
            });
        }

        return deferred.promise;
    }
    _run() {
        while (this._runningCount < this.maxConcurrency && this.stacks.length && this.status !== 'end') {
            let p = this.task.apply(null, this.stacks.shift());
            p.then(
                data => {
                    --this._runningCount;
                    if (this._runningCount <= 0 && this.stacks.length === 0) {
                        this.end();
                    }
                    this.emit('progress', this.totalCount - this.getLength(), this.totalCount);
                    this._run();
                    this._result.push(data);
                },
                err => {
                    this._fail(err);
                }
            );
            this._runningCount++;
        }
    }
    _fail(err) {
        this.status = 'end';
        this.deferred.reject(err);
    }
    end() {
        this._runningCount = 0;
        this.status = 'end';
        this.deferred.resolve(this._result);
    }
}

module.exports = Queue;

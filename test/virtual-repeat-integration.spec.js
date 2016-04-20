import {StageComponent} from './component-tester';

// async queue
function createAssertionQueue() {
  let queue = [];

  let next;
  next = () => {
    if (queue.length) {
      let func = queue.pop();
      setTimeout(() => {
        func();
        next();
      })
    }
  };

  return func => {
    queue.push(func);
    if (queue.length === 1) {
      next();
    }
  };
}
let nq = createAssertionQueue();

describe('VirtualRepeat Integration', () => {
  let component;
  let virtualRepeat;
  let viewModel;
  let itemHeight = 100;
  let create;
  let items;

  function validateState() {
    let views = virtualRepeat.viewSlot.children;
    let expectedHeight = viewModel.items.length * itemHeight;
    let topBufferHeight = virtualRepeat.topBuffer.getBoundingClientRect().height;
    let bottomBufferHeight = virtualRepeat.bottomBuffer.getBoundingClientRect().height;
    let renderedItemsHeight = views.length * itemHeight;
    expect(topBufferHeight + renderedItemsHeight + bottomBufferHeight).toBe(expectedHeight);

    if(viewModel.items.length > views.length) {
      expect(topBufferHeight + bottomBufferHeight).toBeGreaterThan(0);
    }

    // validate contextual data
    for (let i = 0; i < views.length; i++) {
      expect(views[i].bindingContext.item).toBe(viewModel.items[i]);
      let overrideContext = views[i].overrideContext;
      expect(overrideContext.parentOverrideContext.bindingContext).toBe(viewModel);
      expect(overrideContext.bindingContext).toBe(views[i].bindingContext);
      let first = i === 0;
      let last = i === viewModel.items.length - 1;
      let even = i % 2 === 0;
      expect(overrideContext.$index).toBe(i);
      expect(overrideContext.$first).toBe(first);
      expect(overrideContext.$last).toBe(last);
      expect(overrideContext.$middle).toBe(!first && !last);
      expect(overrideContext.$odd).toBe(!even);
      expect(overrideContext.$even).toBe(even);
    }
  }

  function validatePush(done) {
    viewModel.items.push('Foo');
    nq(() => validateState());

    for(let i = 0; i < 5; ++i) {
      viewModel.items.push(`Foo ${i}`);
    }

    nq(() => validateState());
    nq(() => done());
  }

  function validatePop(done) {
    viewModel.items.pop();
      nq(() => validateState());
      nq(() => viewModel.items.pop());
      nq(() => validateState());
      nq(() => viewModel.items.pop());
      nq(() => validateState());
      nq(() => done());
  }

  function validateUnshift(done) {
    viewModel.items.unshift('z');
      nq(() => validateState());
      nq(() => viewModel.items.unshift('y', 'x'));
      nq(() => validateState());
      nq(() => viewModel.items.unshift());
      nq(() => validateState());
      nq(() => done());
  }

  function validateShift(done) {
    viewModel.items.shift();
      nq(() => validateState());
      nq(() => viewModel.items.shift());
      nq(() => validateState());
      nq(() => viewModel.items.shift());
      nq(() => validateState());
      nq(() => done());
  }

  function validateReverse(done) {
    viewModel.items.reverse();
      nq(() => validateState());
      nq(() => done());
  }

  function validateSplice(done) {
    viewModel.items.splice(2, 1, 'x', 'y');
      nq(() => validateState());
      nq(() => done());
  }

  beforeEach(() => {
    items = [];
    for(let i = 0; i < 100; ++i) {
      items.push('item' + i);
    }
    component = StageComponent
      .withResources('src/virtual-repeat')
      .inView(`<div style="height: ${itemHeight}px;" virtual-repeat.for="item of items">\${item}</div>`)
      .boundTo({ items: items });

    create = component.create().then(() => {
      virtualRepeat = component.sut;
      viewModel = component.viewModel;
    });
  });

  it('handles push', done => {
    create.then(() => validatePush(done));
  });

  it('handles pop', done => {
    create.then(() => validatePop(done));
  });

  it('handles unshift', done => {
    create.then(() => validateUnshift(done));
  });

  // bug
  xit('handles shift', done => {
    create.then(() => validateShift(done));
  });

  // bug
  xit('handles reverse', done => {
    create.then(() => validateReverse(done));
  });

  it('handles splice', done => {
    create.then(() => validateSplice(done));
  });
});

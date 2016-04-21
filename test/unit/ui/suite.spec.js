import Suite from '../../../src/ui/suite';
import _ from 'lodash';

describe('ui/suite', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('ui/suite');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Suite()', () => {
    let func;
    beforeEach(() => {
      func = sandbox.spy();
    });

    it('should return an object with a null "parent" prop', () => {
      expect(Suite().parent).to.be.null;
    });

    it('should return an object with a false "pending" prop', () => {
      expect(Suite().pending).to.be.false;
    });

    it('should return an object with an empty "children" prop', () => {
      const suite = Suite();
      expect(suite.children)
        .to
        .be
        .an('array');
      expect(suite.children).to.be.empty;
    });

    describe('when given a non-falsy "parent" prop', () => {
      let parent;
      let rootSuite;

      beforeEach(() => {
        rootSuite = Suite();
        parent = Suite({parent: rootSuite});
        sandbox.stub(parent, 'addChildSuite')
          .returns(parent);
      });

      it('should add the suite as a child of the parent', () => {
        const suite = Suite({parent});
        expect(parent.addChildSuite)
          .to
          .have
          .been
          .calledWithExactly(suite);
      });

      describe('if parent\'s "pending" prop is true', () => {
        beforeEach(() => {
          parent.pending = true;
        });

        describe('and function is not passed', () => {
          it('should inherit the "pending" prop', () => {
            expect(Suite({parent}).pending).to.be.true;
          });
        });

        describe('and function is passed', () => {
          function func () {
          }

          it('should inherit the "pending" prop', () => {
            expect(Suite({
              parent,
              func
            }).pending).to.be.true;
          });
        });
      });

      describe('if parent\'s "pending" prop is false', () => {
        beforeEach(() => {
          parent.func = function () {
          };
        });

        describe('and function is not passed', () => {
          it('should be pending', () => {
            expect(Suite({parent}).pending).to.be.true;
          });
        });

        describe('and function is passed', () => {
          function func () {
          }

          it('should inherit the "pending" prop', () => {
            expect(Suite({
              parent,
              func
            }).pending).not.to.be.true;
          });
        });
      });
    });

    describe('method', () => {
      describe('addChild()', () => {
        it('should add a suite to the "children" Array', () => {
          const parent = Suite();
          const child = Suite();
          parent.addChildSuite(child);
          expect(parent.children[0])
            .to
            .equal(child);
        });
      });

      describe('run()', () => {
        let suite;

        beforeEach(() => {
          suite = Suite({func});
        });

        it('should execute the "func" property in the Suite\'s context', () => {
          return suite.run()
            .then(() => {
              expect(func)
                .to
                .have
                .been
                .calledOn(suite.context);
            });
        });

        it('should emit "will-run"', () => {
          sandbox.stub(suite, 'emit');
          return suite.run()
            .then(() => {
              expect(suite.emit)
                .to
                .have
                .been
                .calledWithExactly('will-run');
            });
        });

        it('should emit "did-run"', () => {
          sandbox.stub(suite, 'emit');
          return suite.run()
            .then(() => {
              expect(suite.emit)
                .to
                .have
                .been
                .calledWithExactly('did-run');
            });
        });

        it('should return the suite', () => {
          return expect(suite.run())
            .to
            .eventually
            .equal(suite);
        });

        it('should store a result (I guess)', () => {
          return suite.run()
            .then(() => {
              expect(suite)
                .to
                .have
                .property('result')
                .with
                .property('passed', true);
            });
        });

        it('should allow asynchronous suites', () => {
          const spy = sandbox.spy();
          suite.func = function (done) {
            setTimeout(function () {
              spy();
              done();
            });
          };
          return suite.run()
            .then(() => {
              expect(spy).to.have.been.calledOnce;
            });
        });

        it('should also allow suites that return a Promise', () => {
          const spy = sandbox.spy();
          suite.func = function () {
            return new Promise(resolve => {
              spy();
              resolve();
            });
          };
          return suite.run()
            .then(() => {
              expect(spy).to.have.been.calledOnce;
            });
        });
      });
    });

    describe('property', () => {
      let suite;
      beforeEach(() => {
        suite = Suite({title: 'foo'});
      });

      describe('pending', () => {
        describe('getter', () => {
          describe('when the Suite has no parent', () => {
            it('should be false', () => {
              expect(suite.pending).to.be.false;
            });
          });

          describe('when the Suite has a parent', () => {
            let parent;

            beforeEach(() => {
              parent = Suite();
              suite.parent = parent;
            });

            describe('and the parent is pending', () => {
              beforeEach(() => {
                parent.pending = true;
              });

              it('should be true', () => {
                expect(suite.pending).to.be.true;
              });
            });

            describe('and the parent is not pending', () => {
              describe('and the Suite has no function', () => {
                it('should be true', () => {
                  expect(suite.pending).to.be.true;
                });
              });

              describe('and the Suite has a function', () => {
                beforeEach(() => {
                  suite.func = _.noop;
                });

                it('should be false', () => {
                  expect(suite.pending).to.be.false;
                });
              });
            });
          });
        });

        describe('setter', () => {
          describe('when the Suite has no parent', () => {
            it('should have no effect', () => {
              suite.pending = true;
              expect(suite.pending).to.be.false;
            });
          });

          describe('when the Suite has a parent', () => {
            let parent;

            beforeEach(() => {
              parent = Suite();
              suite.parent = parent;
            });

            describe('and the Suite has no initial function', () => {
              describe('and the value is falsy', () => {
                beforeEach(() => {
                  suite.pending = false;
                });

                it('should have a "true" pending value', () => {
                  expect(suite.pending).to.be.true;
                });

                it('should have a null function', () => {
                  expect(suite.func).to.be.null;
                });
              });
            });
          });
        });
      });

      describe('fullTitle', () => {
        describe('getter', () => {
          describe('when the Suite has no parent', () => {
            it('should return the title', () => {
              expect(suite.fullTitle)
                .to
                .equal(suite.title);
            });
          });

          describe('when the Suite has a parent', () => {
            let parent;

            beforeEach(() => {
              parent = Suite({title: 'bar'});
              suite.parent = parent;
            });

            it('should concatenate the titles', () => {
              expect(suite.fullTitle)
                .to
                .equal('bar foo');
            });
          });
        });

        describe('setter', () => {
          it('should throw a TypeError', () => {
            expect(() => suite.fullTitle = 'blah')
              .to
              .throw(TypeError);
          });
        });
      });
    });
  });
});

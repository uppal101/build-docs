const assert = require('assert');

const docs = require('../');

describe('build-docs', () => {
  it('should work for multiple blocks', () => {
    const description = 'Creates a user in the database';
    assert.deepEqual(docs(`
      /*
       * ${description}
       */

      /*
       * ${description}
       */
    `).map(a => a.description), [description, description]);
  });

  describe('description', () => {
    it('should extract the description', () => {
      const description = 'Creates a user in the database';
      assert.deepEqual(docs(`
        /*
         * ${description}
         */
      `)[0].description, description);
    });

    it('should remove the action if set', () => {
      const description = 'Creates a user in the database';
      assert.deepEqual(docs(`
        /*
         * action: ${description}
         */
      `)[0].description, description);
    });
  });

  describe('@param', () => {
    function testParam(comments, expected) {
      if (!Array.isArray(comments)) {
        comments = [comments]; // eslint-disable-line no-param-reassign
      }

      if (!Array.isArray(expected)) {
        expected = [expected]; // eslint-disable-line no-param-reassign
      }

      // This is sketchy... but it works
      assert.deepEqual(docs(`
        /*
${comments.map(comment => `           * @param ${comment}`).join('\n')}
         */
      `)[0].params, expected);
    }

    it('should extract primitives from comments', () => {
      testParam('{string} name Name of the user', {
        type: 'string',
        title: 'name',
        description: 'Name of the user',
      });
    });

    it('should extract arrays of primitives from comments', () => {
      testParam('{string[]} interests Interests of the user', {
        type: 'array',
        items: {
          type: 'string',
        },
        title: 'interests',
        description: 'Interests of the user',
      });
    });

    it('should correctly work with object arrays', () => {
      testParam('{Object[]} interests Interests of the user', {
        type: 'array',
        items: {
          type: 'object',
        },
        title: 'interests',
        description: 'Interests of the user',
      });
    });

    it('should extract objects ', () => {
      testParam('{Object} address Address of the user', {
        type: 'object',
        title: 'address',
        description: 'Address of the user',
      });
    });

    it('should extract nested objects', () => {
      testParam([
        '{Object} address Address of the user',
        '{string} address.street Street of the user',
        '{string} address.city City of the user',
        '{string} address.state State of the user',
        '{string} address.zip Zip code of the user',
      ], {
        type: 'object',
        title: 'address',
        description: 'Address of the user',
        properties: {
          street: { type: 'string', description: 'Street of the user' },
          city: { type: 'string', description: 'City of the user' },
          state: { type: 'string', description: 'State of the user' },
          zip: { type: 'string', description: 'Zip code of the user' },
        },
      });
    });

    it('should extract arrays of nested objects', () => {
      testParam([
        '{Object[]} favouriteFoods Favourite foods of the user',
        '{string} favouriteFoods[].cuisine Name of the cuisine',
        '{string} favouriteFoods[].dish Favourite dish',
      ], {
        type: 'array',
        title: 'favouriteFoods',
        description: 'Favourite foods of the user',
        items: {
          type: 'object',
          properties: {
            cuisine: {
              type: 'string',
              description: 'Name of the cuisine',
            },
            dish: {
              type: 'string',
              description: 'Favourite dish',
            },
          },
        },
      });
    });

    it('should work for recursively nested objects');
  });

  describe('@throws', () => {
    function testThrows(comments, expected) {
      if (!Array.isArray(comments)) {
        comments = [comments]; // eslint-disable-line no-param-reassign
      }

      if (!Array.isArray(expected)) {
        expected = [expected]; // eslint-disable-line no-param-reassign
      }

      // This is sketchy... but it works
      assert.deepEqual(docs(`
        /*
${comments.map(comment => `           * @throws ${comment}`).join('\n')}
         */
      `)[0].throws, expected);
    }

    it('should work with just a description', () => {
      const description = 'Will throw an error if the argument is null';

      testThrows(description, { description });
    });

    it('should work with just a type', () => {
      const type = '{ValidationError}';

      testThrows(type, { type: type.replace(/{|}/g, '') });
    });

    it('should work with type and description', () => {
      const type = '{ValidationError}';
      const description = 'Will throw an error if the argument is null';

      testThrows(`${type} ${description}`, { type: type.replace(/{|}/g, ''), description });
    });
  });

  describe('alternative comment styles', () => {
    // This style can't be supported because esprima picks each
    // line up as a new comment because technically it starts/ends
    // on the same line
    it.skip('single line comments', () => {
      const description = 'Creates a user in the database';
      assert.deepEqual(docs(`
        //
        // ${description}
        //
      `)[0].description, description);
    });

    it('marc-style comments', () => {
      const description = 'Creates a user in the database';
      assert.deepEqual(docs(`
        /*
          ${description}
         */
      `)[0].description, description);
    });
  });

  describe('@name', () => {
    it('should add a name based on the string before the description', () => {
      assert.equal(docs(`
        /*
         * action: Description
         */
      `)[0].name, 'action');
    });

    it('should add it with @name', () => {
      assert.equal(docs(`
        /*
         * Description
         *
         * @name action
         */
      `)[0].name, 'action');
    });

    it('should take the first @name', () => {
      assert.equal(docs(`
        /*
         * Description
         *
         * @name action
         * @name action1
         */
      `)[0].name, 'action');
    });

    it('should favour the former over the latter', () => {
      assert.equal(docs(`
        /*
         * action: Description
         *
         * @name action1
         */
      `)[0].name, 'action');
    });

    it('should default to empty string', () => {
      assert.equal(docs(`
        /*
         * Description
         */
      `)[0].name, '');
    });
  });
});

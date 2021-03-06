import Set from '../set';
import cache from './cache-traversal-call';

/**
 * @class nodes
 */
let elesfn = ({

  /**
 * @typedef {object} nodes_parent
 * @property {object} selector - [optional] A selector used to filter the resultant collection.
 */

/**
 * Get the compound parent node of each node in the collection.
 * @memberof nodes
 * @path Collection/Compound nodes
 * @param {...nodes_parent} selector - Get Parent Node.
 * @namespace nodes.parent
 */
  parent: function( selector ){
    let parents = [];

    // optimisation for single ele call
    if( this.length === 1 ){
      let parent = this[0]._private.parent;

      if( parent ){ return parent; }
    }

    for( let i = 0; i < this.length; i++ ){
      let ele = this[ i ];
      let parent = ele._private.parent;

      if( parent ){
        parents.push( parent );
      }
    }

    return this.spawn( parents, true ).filter( selector );
  },

  parents: function( selector ){
    let parents = [];

    let eles = this.parent();
    while( eles.nonempty() ){
      for( let i = 0; i < eles.length; i++ ){
        let ele = eles[ i ];
        parents.push( ele );
      }

      eles = eles.parent();
    }

    return this.spawn( parents, true ).filter( selector );
  },

  /**
 * @typedef {object} nodes_commonAncestors
 * @property {object} selector - [optional] A selector used to filter the resultant collection.
 */

/**
 * Get all compound ancestors common to all the nodes in the collection, starting with the closest and getting progressively farther.
 * @memberof nodes
 * @path Collection/Compound nodes
 * @param {...nodes_commonAncestors} selector - Get commonAncestors Node.
 * @namespace nodes.commonAncestors
 */
  commonAncestors: function( selector ){
    let ancestors;

    for( let i = 0; i < this.length; i++ ){
      let ele = this[ i ];
      let parents = ele.parents();

      ancestors = ancestors || parents;

      ancestors = ancestors.intersect( parents ); // current list must be common with current ele parents set
    }

    return ancestors.filter( selector );
  },

  /**
 * @typedef {object} nodes_orphans
 * @property {object} selector - [optional] A selector used to filter the resultant collection.
 */

/**
 * Get all orphan (i.e. has no compound parent) nodes in the calling collection.
 * @memberof nodes
 * @path Collection/Compound nodes
 * @param {...nodes_orphans} selector - Get orphans Node.
 * @namespace nodes.orphans
 */
  orphans: function( selector ){
    return this.stdFilter( function( ele ){
      return ele.isOrphan();
    } ).filter( selector );
  },

  /**
 * @typedef {object} nodes_nonorphans
 * @property {object} selector - [optional] A selector used to filter the resultant collection.
 */

/**
 * Get all nonorphan (i.e. has no compound parent) nodes in the calling collection.
 * @memberof nodes
 * @path Collection/Compound nodes
 * @param {...nodes_nonorphans} selector - Get nonorphans Node.
 * @namespace nodes.nonorphans
 */
  nonorphans: function( selector ){
    return this.stdFilter( function( ele ){
      return ele.isChild();
    } ).filter( selector );
  },

  /**
 * @typedef {object} nodes_children
 * @property {object} selector - [optional] A selector used to filter the resultant collection.
 */

/**
 * Get all compound child (i.e. direct descendant) nodes of each node in the collection.
 * @memberof nodes
 * @path Collection/Compound nodes
 * @param {...nodes_children} selector - Get children Node.
 * @namespace nodes.children
 */
  children: cache( function( selector ){
    let children = [];

    for( let i = 0; i < this.length; i++ ){
      let ele = this[ i ];
      let eleChildren = ele._private.children;

      for( let j = 0; j < eleChildren.length; j++ ){
        children.push( eleChildren[j] );
      }
    }

    return this.spawn( children, true ).filter( selector );
  }, 'children' ),

  /**
 * @typedef {object} nodes_siblings
 * @property {object} selector - [optional] A selector used to filter the resultant collection.
 */

/**
 * Get all sibling (i.e. same compound parent) nodes of each node in the collection.
 * @memberof nodes
 * @path Collection/Compound nodes
 * @param {...nodes_siblings} selector - Get siblings Node.
 * @namespace nodes.siblings
 */
  siblings: function( selector ){
    return this.parent().children().not( this ).filter( selector );
  },

  /**
 * Get whether the node is a compound parent (i.e. a node containing one or more child nodes)
 * @memberof nodes
 * @path Collection/Compound nodes
 * @namespace nodes.isParent
 */
  isParent: function(){
    let ele = this[0];

    if( ele ){
      return ele.isNode() && ele._private.children.length !== 0;
    }
  },

  /**
 * Get whether the node is childless (i.e. a node with no child nodes)
 * @memberof nodes
 * @path Collection/Compound nodes
 * @namespace nodes.isChildless
 */
  isChildless: function(){
    let ele = this[0];

    if( ele ){
      return ele.isNode() && ele._private.children.length === 0;
    }
  },

  /**
 * Get whether the node is a compound child (i.e. contained within a node)
 * @memberof nodes
 * @path Collection/Compound nodes
 * @namespace nodes.isChild
 */
  isChild: function(){
    let ele = this[0];

    if( ele ){
      return ele.isNode() && ele._private.parent != null;
    }
  },

  /**
 * Get whether the node is an orphan (i.e. a node with no parent)
 * @memberof nodes
 * @path Collection/Compound nodes
 * @namespace nodes.isOrphan
 */
  isOrphan: function(){
    let ele = this[0];

    if( ele ){
      return ele.isNode() && ele._private.parent == null;
    }
  },

  /**
 * @typedef {object} nodes_descendants
 * @property {object} selector - [optional] A selector used to filter the resultant collection.
 */

/**
 * Get all compound descendant (i.e. children, children's children, etc.) nodes of each node in the collection.
 * @memberof nodes
 * @path Collection/Compound nodes
 * @param {...nodes_descendants} selector - Get descendants Node.
 * @namespace nodes.descendants
 */
  descendants: function( selector ){
    let elements = [];

    function add( eles ){
      for( let i = 0; i < eles.length; i++ ){
        let ele = eles[ i ];

        elements.push( ele );

        if( ele.children().nonempty() ){
          add( ele.children() );
        }
      }
    }

    add( this.children() );

    return this.spawn( elements, true ).filter( selector );
  }
});

function forEachCompound( eles, fn, includeSelf, recursiveStep ){
  let q = [];
  let did = new Set();
  let cy = eles.cy();
  let hasCompounds = cy.hasCompoundNodes();

  for( let i = 0; i < eles.length; i++ ){
    let ele = eles[i];

    if( includeSelf ){
      q.push( ele );
    } else if( hasCompounds ){
      recursiveStep( q, did, ele );
    }
  }

  while( q.length > 0 ){
    let ele = q.shift();

    fn( ele );

    did.add( ele.id() );

    if( hasCompounds ){
      recursiveStep( q, did, ele );
    }
  }

  return eles;
}

function addChildren( q, did, ele ){
  if( ele.isParent() ){
    let children = ele._private.children;

    for( let i = 0; i < children.length; i++ ){
      let child = children[i];

      if( !did.has( child.id() ) ){
        q.push( child );
      }
    }
  }
}

// very efficient version of eles.add( eles.descendants() ).forEach()
// for internal use
elesfn.forEachDown = function( fn, includeSelf = true ){
  return forEachCompound( this, fn, includeSelf, addChildren );
};

function addParent( q, did, ele ){
  if( ele.isChild() ){
    let parent = ele._private.parent;

    if( !did.has( parent.id() ) ){
      q.push( parent );
    }
  }
}

elesfn.forEachUp = function( fn, includeSelf = true ){
  return forEachCompound( this, fn, includeSelf, addParent );
};

function addParentAndChildren( q, did, ele ){
  addParent( q, did, ele );
  addChildren( q, did, ele );
}

elesfn.forEachUpAndDown = function( fn, includeSelf = true ){
  return forEachCompound( this, fn, includeSelf, addParentAndChildren );
};

// aliases
elesfn.ancestors = elesfn.parents;

export default elesfn;

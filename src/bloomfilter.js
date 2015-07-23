var BloomFilter = (function() { //eslint-disable-line no-unused-vars
  'use strict';
  var typedArrays = typeof ArrayBuffer !== 'undefined';

  // Creates a new bloom filter.  If *m* is an array-like object, with a length
  // property, then the bloom filter is loaded with data from the array, where
  // each element is a 32-bit integer.  Otherwise, *m* should specify the
  // number of bits.  Note that *m* is rounded up to the nearest multiple of
  // 32.  *k* specifies the number of hashing functions.
  function BloomFilter(m, k) {
    /* eslint complexity:[2, 10] */
    var a;
    if (typeof m !== 'number') {
      a = m, m = a.length * 32; //eslint-disable-line
    }

    var n = Math.ceil(m / 32),
        i = -1;
    this.m = m = n * 32;
    this.k = k;

    if (typedArrays) {
      // if typed arrays are supported
      var kbytes = 1 << Math.ceil(Math.log(Math.ceil(Math.log(m) / Math.LN2 / 8)) / Math.LN2),
          array = (kbytes === 1) ?
                                  (Uint8Array) :
                                  (kbytes === 2 ?
                                                Uint16Array : Uint32Array),
          kbuffer = new ArrayBuffer(kbytes * k),
          buckets = this.buckets = new Int32Array(n);
      if (a) {
        i = i + 1;
        while (i < n) {
          buckets[i] = a[i];
          i++;
        }
      }

      this._locations = new array(kbuffer);
    } else {
      // typed arrays not supported
      buckets = this.buckets = [];
      if (a) {
        i = i + 1;
        while (i < n) {
          buckets[i] = a[i];
          i++;
        }
      }
      else {
        i = i + 1;
        while (i < n) {
          //initialize bucket with zeroes
          buckets[i] = 0;
          i++;
        }
      }
      this._locations = [];
    }
  }

  // See http://willwhim.wpengine.com/2011/09/03/producing-n-hash-functions-by-hashing-only-once/
  BloomFilter.prototype.locations = function(v) {
    var k = this.k,
        m = this.m,
        r = this._locations,
        a = fnv_1a(v),
        b = fnv_1a_b(a),
        x = a % m;
    for (var i = 0; i < k; i++) {
      r[i] = x < 0 ? (x + m) : x;
      x = (x + b) % m;
    }
    return r;
  };

  BloomFilter.prototype.add = function(v) {
    var l = this.locations(v + ''),
        k = this.k,
        buckets = this.buckets;
    for (var i = 0; i < k; i++) {
      buckets[Math.floor(l[i] / 32)] |= 1 << (l[i] % 32);
    }
  };

  BloomFilter.prototype.test = function(v) {
    var l = this.locations(v + ''),
        k = this.k,
        buckets = this.buckets;
    for (var i = 0; i < k; i++) {
      var b = l[i];
      if ((buckets[Math.floor(b / 32)] & (1 << (b % 32))) === 0) {
        return false;
      }
    }
    return true;
  };

  // Estimated cardinality.
  BloomFilter.prototype.size = function() {
    var buckets = this.buckets,
        bits = 0;
    for (var i = 0, n = buckets.length; i < n; i++) {
      bits += popcnt(buckets[i]);
    }
    return -this.m * Math.log(1 - bits / this.m) / this.k;
  };

  // http://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetParallel
  function popcnt(v) {
    v -= (v >> 1) & 0x55555555;
    v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
    return ((v + (v >> 4) & 0xf0f0f0f) * 0x1010101) >> 24;
  }

  // Fowler/Noll/Vo hashing.
  function fnv_1a(v) {
    var a = 2166136261;
    for (var i = 0, n = v.length; i < n; i++) {
      var c = v.charCodeAt(i),
          d = c & 0xff00;
      if (d) {
        a = fnv_multiply(a ^ d >> 8);
      }
      a = fnv_multiply(a ^ c & 0xff);
    }
    return fnv_mix(a);
  }

  // a * 16777619 mod 2**32
  function fnv_multiply(a) {
    return a + (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
  }

  // One additional iteration of FNV, given a hash.
  function fnv_1a_b(a) {
    return fnv_mix(fnv_multiply(a));
  }

  // See https://web.archive.org/web/20131019013225/http://home.comcast.net/~bretm/hash/6.html
  function fnv_mix(a) {
    a += a << 13;
    a ^= a >>> 7;
    a += a << 3;
    a ^= a >>> 17;
    a += a << 5;
    return a & 0xffffffff;
  }
  return BloomFilter;
})();
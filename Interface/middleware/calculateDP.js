class DecimalPoint {
  /**
   * 
   * @param {*} a 
   * @description Function returing decimal point for paasing argument
   */
    async precision(a) {
      a = parseFloat(a);
        if (!isFinite(a)) return 0;
        var e = 1, p = 0;
        while (Math.round(a * e) / e !== a) { e *= 10; p++; }
        return p;
      }
}
module.exports = DecimalPoint;
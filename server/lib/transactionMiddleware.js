export function transact(db) {
  return (req, res, next) =>
    db.transaction(trx => {
      req.trx = trx;
      next();
    });
}

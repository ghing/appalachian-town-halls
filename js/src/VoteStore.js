class VoteStore {
  constructor() {
    this._votes = [];
    this._votesByDivision = {};
  }

  setVotes(votes) {
    this._votes = [];
    this._votesByDivision = {};

    votes.forEach(this.addVote, this);

    return this;
  }

  addVote(vote) {
    this._votes.push[vote];
    this._votesByDivision[vote.ocd_id] = vote;
  }

  getVotes() {
    return this._votes;
  }

  getVoteForDivision(ocdId) {
    return this._votesByDivision[ocdId];
  }
}

export default VoteStore;

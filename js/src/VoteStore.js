class VoteStore {
  constructor() {
    this.votes = [];
    this.votesByDivision = {};
  }

  setVotes(votes) {
    this.votes = [];
    this.votesByDivision = {};

    votes.forEach(this.addVote, this);

    return this;
  }

  addVote(vote) {
    this.votes.push(vote);
    this.votesByDivision[vote.ocd_id] = vote;
  }

  getVotes() {
    return this.votes;
  }

  getVoteForDivision(ocdId) {
    return this.votesByDivision[ocdId];
  }
}

export default VoteStore;

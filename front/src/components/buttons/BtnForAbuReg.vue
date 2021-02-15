<template>
  <div>
    <v-btn color="primary" @click="register">Fingerprint</v-btn>
    <v-btn color="primary"  v-if="isCreated" @click="removeCredential">Delete</v-btn>
  </div>
</template>

<script>
import {_fetch, registerCredential, unregisterCredential} from "../../utils/webauthn";

export default {
name: "btnForAbuReg",
data: () => ({
    username: localStorage.getItem('username'),
    isCreated: false,
  }),
methods: {
  register(){
    registerCredential(this.username)
        .then(user => {
          console.log(user)
          this.isCreated = true;
        })
        .catch(e => alert(e));

  },
  async removeCredential(){
    const res = await _fetch('http://localhost:3001/webauthn/getKeys');
    try {
      console.log(res.id)
      await unregisterCredential(res.id);
    } catch (e) {
      alert(e);
    }
  }
}
}
</script>


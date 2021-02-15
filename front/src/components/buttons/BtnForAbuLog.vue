<template>
  <v-dialog
      v-model="dialog"
      width="500"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
          color="red lighten-2"
          dark
          v-bind="attrs"
          v-on="on"
      >
        Click Me
      </v-btn>
    </template>

    <v-card>
      <v-container>
        <v-form v-model="valid">
          <v-text-field
              label="Email"
              v-model="email"
              :rules="emailRules"
              type="text"
              required
          ></v-text-field>
        </v-form>
      </v-container>
      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
            color="primary"
            text
            @click="dialog = false"
        >

          Close
        </v-btn>
        <v-btn
            color="primary"
            text
            @click="authn"
        >
          Finger
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import {authenticate} from "../../utils/webauthn";

export default {
  name: "BtnForAbu",
  data: () => ({
    dialog: false,
    valid: false,
    email: '',
    emailRules: [
      v => !!v || 'E-mail is required',
      v => /.+@.+/.test(v) || 'E-mail must be valid',
    ],
  }),
  methods: {
    authn() {
      let self = this;
      if (this.valid) {
        authenticate()
            .then(user => {
              if (user) {
                alert('success');
                localStorage.setItem('username', user.username);
                localStorage.setItem('isAuth', "true");
                self.$router.push('/')
              } else {
                throw 'User not found.';
              }
            }).catch(e => {
          console.error(e.message || e);
          alert('Authentication failed. Use password to sign-in.');
        });
      }
    },
  }
}
</script>
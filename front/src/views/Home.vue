<template>
  <v-app id="inspire">
    <v-content>
      <v-container
        class="fill-height"
        fluid
      >
        <v-row
          align="center"
          justify="center"
        >
          <v-col
            cols="12"
            sm="8"
            md="4"
          >
            <v-card class="elevation-12">
              <v-toolbar
                dark
                flat
              >
                <v-toolbar-title>Welcome {{username}}!</v-toolbar-title>
                <v-spacer></v-spacer>
              </v-toolbar>

              <v-card-text>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consectetur
                dolorem incidunt ipsa quam tenetur vitae!
                Asperiores, facilis illum itaque iure laborum pariatur perspiciatis
                porro quis sequi tenetur? Esse soluta, veniam!
              </v-card-text>
              <v-card-actions>
              <v-btn color="primary" @click="submit">Logout</v-btn>
                <v-spacer></v-spacer>
                <v-spacer></v-spacer>
                <BtnForAbuReg/>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
// @ is an alias to /src

import BtnForAbuReg from "../components/buttons/BtnForAbuReg";
export default {
  name: 'Home',
  data: () => ({
    username: localStorage.getItem('username')
  }),
  components:{
    BtnForAbuReg
  },
  methods: {
    submit(){
      localStorage.setItem('isAuth',"false")
      localStorage.setItem('username','')
      this.username = localStorage.getItem('username')
      this.$router.push('/login')
    },

  }
};

</script>
